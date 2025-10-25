# Frontend Migration Guide: Firebase → AWS Cognito

This guide details the changes needed in the frontend code to migrate from Firebase Authentication to AWS Cognito and API Gateway.

## Overview

**What's Changing:**
- Firebase Auth → AWS Cognito
- Local state management → DynamoDB via API Gateway
- Firebase SDK → AWS Amplify

**What Stays the Same:**
- React components structure
- UI/UX design
- TypeScript types
- Most business logic

---

## Step 1: Install Dependencies

### Install AWS Amplify

```bash
npm install aws-amplify @aws-amplify/ui-react
```

### Remove Firebase (Optional)

```bash
npm uninstall firebase
```

---

## Step 2: Create AWS Configuration

### Create `src/aws-config.ts`

```typescript
import { Amplify } from 'aws-amplify';

const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
      loginWith: {
        email: true,
      },
      signUpVerificationMethod: 'code', // or 'link'
      userAttributes: {
        email: {
          required: true,
        },
        name: {
          required: true,
        },
      },
      passwordFormat: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialCharacters: true,
      },
    },
  },
  API: {
    REST: {
      homeschoolApi: {
        endpoint: import.meta.env.VITE_API_GATEWAY_URL,
        region: import.meta.env.VITE_AWS_REGION,
      },
    },
  },
};

Amplify.configure(awsConfig);

export default awsConfig;
```

---

## Step 3: Update Environment Variables

### Update `.env`

```env
# Remove Firebase variables
# VITE_FIREBASE_API_KEY=...
# VITE_FIREBASE_AUTH_DOMAIN=...
# etc.

# Add AWS variables
VITE_AWS_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
VITE_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_API_GATEWAY_URL=https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod
```

### Update `.env.example`

```env
# AWS Configuration
VITE_AWS_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=your_user_pool_id
VITE_COGNITO_CLIENT_ID=your_client_id
VITE_API_GATEWAY_URL=your_api_gateway_url
```

---

## Step 4: Update AuthContext

### Replace `src/contexts/AuthContext.tsx`

```typescript
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  signIn,
  signUp,
  signOut,
  confirmSignUp,
  resetPassword,
  confirmResetPassword,
  fetchAuthSession,
  fetchUserAttributes,
  updateUserAttributes,
  getCurrentUser,
  type SignInOutput,
} from 'aws-amplify/auth';

interface User {
  userId: string;
  email: string;
  name?: string;
  emailVerified: boolean;
}

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  confirmSignup: (email: string, code: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  confirmPasswordReset: (email: string, code: string, newPassword: string) => Promise<void>;
  getIdToken: () => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check auth state on mount
  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const user = await getCurrentUser();
      const attributes = await fetchUserAttributes();

      setCurrentUser({
        userId: user.userId,
        email: attributes.email || '',
        name: attributes.name,
        emailVerified: attributes.email_verified === 'true',
      });
    } catch (error) {
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, name?: string) => {
    const { isSignUpComplete, userId, nextStep } = await signUp({
      username: email,
      password,
      options: {
        userAttributes: {
          email,
          name: name || '',
        },
      },
    });

    if (nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
      // User needs to confirm email with code
      throw new Error('CONFIRMATION_REQUIRED');
    }

    await checkUser();
  };

  const confirmSignup = async (email: string, code: string) => {
    await confirmSignUp({
      username: email,
      confirmationCode: code,
    });
  };

  const login = async (email: string, password: string) => {
    const { isSignedIn } = await signIn({
      username: email,
      password,
    });

    if (isSignedIn) {
      await checkUser();
    }
  };

  const logout = async () => {
    await signOut();
    setCurrentUser(null);
  };

  const resetPasswordRequest = async (email: string) => {
    await resetPassword({
      username: email,
    });
  };

  const confirmPasswordReset = async (
    email: string,
    code: string,
    newPassword: string
  ) => {
    await confirmResetPassword({
      username: email,
      confirmationCode: code,
      newPassword,
    });
  };

  const getIdToken = async (): Promise<string> => {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString() || '';
  };

  const value: AuthContextType = {
    currentUser,
    loading,
    signup,
    confirmSignup,
    login,
    logout,
    resetPassword: resetPasswordRequest,
    confirmPasswordReset,
    getIdToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
```

---

## Step 5: Update Login Component

### Update `src/components/auth/Login.tsx`

```typescript
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(getErrorMessage(err.message || err.toString()));
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (errorCode: string) => {
    if (errorCode.includes('UserNotFoundException')) {
      return 'No account found with this email.';
    }
    if (errorCode.includes('NotAuthorizedException')) {
      return 'Incorrect email or password.';
    }
    if (errorCode.includes('UserNotConfirmedException')) {
      return 'Please verify your email before signing in.';
    }
    return 'Failed to log in. Please try again.';
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Welcome Back
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Sign in to your homeschool tracker account
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <Link
                to="/forgot-password"
                style={{ textDecoration: 'none', color: '#546e7a', fontSize: '0.875rem' }}
              >
                Forgot password?
              </Link>
            </Box>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Don't have an account?{' '}
              <Link
                to="/signup"
                style={{ textDecoration: 'none', color: '#546e7a', fontWeight: 600 }}
              >
                Sign up
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
```

---

## Step 6: Update Signup Component

### Update `src/components/auth/Signup.tsx`

Add email verification step:

```typescript
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

const Signup = () => {
  const [step, setStep] = useState<'signup' | 'confirm'>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signup, confirmSignup } = useAuth();
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    if (password.length < 8) {
      return setError('Password must be at least 8 characters.');
    }

    try {
      setError('');
      setLoading(true);
      await signup(email, password, name);
      setStep('confirm');
    } catch (err: any) {
      if (err.message === 'CONFIRMATION_REQUIRED') {
        setStep('confirm');
      } else {
        setError(getErrorMessage(err.message || err.toString()));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setError('');
      setLoading(true);
      await confirmSignup(email, verificationCode);
      navigate('/login');
    } catch (err: any) {
      setError('Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (errorCode: string) => {
    if (errorCode.includes('UsernameExistsException')) {
      return 'An account with this email already exists.';
    }
    if (errorCode.includes('InvalidPasswordException')) {
      return 'Password does not meet requirements.';
    }
    return 'Failed to create account. Please try again.';
  };

  if (step === 'confirm') {
    return (
      <Container maxWidth="sm">
        <Box sx={{ mt: 8, mb: 4 }}>
          <Paper elevation={3} sx={{ p: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom align="center">
              Verify Your Email
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
              We sent a verification code to {email}
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleConfirm}>
              <TextField
                label="Verification Code"
                type="text"
                fullWidth
                margin="normal"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                required
                disabled={loading}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Verify Email'}
              </Button>
            </form>
          </Paper>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Create Account
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Start tracking your homeschool journey
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSignup}>
            <TextField
              label="Full Name"
              type="text"
              fullWidth
              margin="normal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
            />
            <TextField
              label="Email"
              type="email"
              fullWidth
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              helperText="At least 8 characters with uppercase, lowercase, and number"
            />
            <TextField
              label="Confirm Password"
              type="password"
              fullWidth
              margin="normal"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </Button>
          </form>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Already have an account?{' '}
              <Link
                to="/login"
                style={{ textDecoration: 'none', color: '#546e7a', fontWeight: 600 }}
              >
                Sign in
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Signup;
```

---

## Step 7: Update UserMenu Component

### Update `src/components/auth/UserMenu.tsx`

```typescript
// Minimal changes needed - just update the user data access
const displayName = currentUser.name || currentUser.email || 'User';
const email = currentUser.email;
```

---

## Step 8: Create API Service

### Create `src/services/api.ts`

```typescript
import { get, post, put, del } from 'aws-amplify/api';
import { fetchAuthSession } from 'aws-amplify/auth';

const API_NAME = 'homeschoolApi';

// Helper to get auth headers
const getAuthHeaders = async () => {
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();

  return {
    Authorization: `Bearer ${token}`,
  };
};

// Generic API methods
export const apiGet = async (path: string) => {
  const headers = await getAuthHeaders();
  const response = await get({
    apiName: API_NAME,
    path,
    options: { headers },
  }).response;

  return response.body.json();
};

export const apiPost = async (path: string, data: any) => {
  const headers = await getAuthHeaders();
  const response = await post({
    apiName: API_NAME,
    path,
    options: {
      headers,
      body: data,
    },
  }).response;

  return response.body.json();
};

export const apiPut = async (path: string, data: any) => {
  const headers = await getAuthHeaders();
  const response = await put({
    apiName: API_NAME,
    path,
    options: {
      headers,
      body: data,
    },
  }).response;

  return response.body.json();
};

export const apiDelete = async (path: string) => {
  const headers = await getAuthHeaders();
  const response = await del({
    apiName: API_NAME,
    path,
    options: { headers },
  }).response;

  return response.body.json();
};

// Students API
export const studentsApi = {
  getAll: () => apiGet('/students'),
  get: (id: string) => apiGet(`/students/${id}`),
  create: (data: any) => apiPost('/students', data),
  update: (id: string, data: any) => apiPut(`/students/${id}`, data),
  delete: (id: string) => apiDelete(`/students/${id}`),
};

// Subjects API
export const subjectsApi = {
  getAll: () => apiGet('/subjects'),
  get: (id: string) => apiGet(`/subjects/${id}`),
  create: (data: any) => apiPost('/subjects', data),
  update: (id: string, data: any) => apiPut(`/subjects/${id}`, data),
  delete: (id: string) => apiDelete(`/subjects/${id}`),
};

// Time Entries API
export const timeEntriesApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiGet(`/time-entries${query}`);
  },
  get: (id: string) => apiGet(`/time-entries/${id}`),
  create: (data: any) => apiPost('/time-entries', data),
  update: (id: string, data: any) => apiPut(`/time-entries/${id}`, data),
  delete: (id: string) => apiDelete(`/time-entries/${id}`),
};

// Reports API
export const reportsApi = {
  getSummary: () => apiGet('/reports/summary'),
  getByStudent: (studentId: string) => apiGet(`/reports/by-student?studentId=${studentId}`),
  getBySubject: (subjectId: string) => apiGet(`/reports/by-subject?subjectId=${subjectId}`),
};

// Settings API
export const settingsApi = {
  get: () => apiGet('/settings'),
  update: (data: any) => apiPut('/settings', data),
};
```

---

## Step 9: Update App.tsx

### Update `src/App.tsx`

```typescript
import { useEffect } from 'react';
import './aws-config'; // Import at the top to initialize Amplify

// Rest of your App component remains the same
```

---

## Step 10: Update Data Management

Replace local state with API calls in:
- `src/hooks/useAppState.tsx` - Replace localStorage with API calls
- `src/components/StudentsManager.tsx` - Use `studentsApi`
- `src/components/SubjectsManager.tsx` - Use `subjectsApi`
- `src/components/TimeTracker.tsx` - Use `timeEntriesApi`
- `src/components/Reports.tsx` - Use `reportsApi`
- `src/components/Dashboard.tsx` - Use `reportsApi.getSummary()`

---

## Migration Checklist

### Code Changes
- [ ] Install AWS Amplify
- [ ] Create `aws-config.ts`
- [ ] Update `.env` with AWS credentials
- [ ] Replace `AuthContext.tsx` with Cognito version
- [ ] Update `Login.tsx`
- [ ] Update `Signup.tsx` (add verification step)
- [ ] Update `ForgotPassword.tsx`
- [ ] Create `api.ts` service
- [ ] Update all components to use API instead of local state
- [ ] Remove Firebase dependencies

### Testing
- [ ] Test signup with email verification
- [ ] Test login
- [ ] Test logout
- [ ] Test password reset
- [ ] Test creating students
- [ ] Test creating subjects
- [ ] Test time entry tracking
- [ ] Test reports generation
- [ ] Test error handling
- [ ] Test offline behavior

### Deployment
- [ ] Build production bundle
- [ ] Deploy to S3
- [ ] Test in production environment
- [ ] Monitor CloudWatch logs
- [ ] Check API latency

---

## Key Differences: Firebase vs Cognito

| Feature | Firebase | AWS Cognito |
|---------|----------|-------------|
| Sign Up | Immediate | Requires email verification |
| Social Login | Built-in providers | Configure separately in Cognito |
| Token Storage | Automatic | Manual (use Amplify) |
| Session Persistence | Auto | Auto (via Amplify) |
| Password Reset | Email link | Verification code |
| User Attributes | Limited | Fully customizable |

---

## Common Issues & Solutions

### Issue: "User is not authenticated"
**Solution**: Make sure to await `getIdToken()` before API calls

### Issue: Email verification code not received
**Solution**: Check spam folder, verify SES configuration in Cognito

### Issue: CORS errors
**Solution**: Verify API Gateway CORS settings match your domain

### Issue: Token expired
**Solution**: Amplify handles refresh automatically, check session

---

## Performance Considerations

1. **API Latency**: First request may be slow (Lambda cold start)
2. **Caching**: Implement React Query for better performance
3. **Optimistic Updates**: Update UI immediately, sync in background
4. **Pagination**: Implement for large data sets
5. **Debouncing**: Debounce search and filter operations

---

## Next Steps After Migration

1. Implement React Query for caching and optimistic updates
2. Add error boundary components
3. Implement retry logic for failed API calls
4. Add loading states throughout the app
5. Implement proper error handling
6. Add unit tests for API services
7. Add integration tests
8. Set up CI/CD pipeline
