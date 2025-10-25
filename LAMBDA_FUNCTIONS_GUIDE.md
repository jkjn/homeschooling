# Lambda Functions Implementation Guide

This guide provides sample code for the Lambda functions needed for the Homeschool Time Tracker backend.

## Directory Structure

```
backend/
├── template.yaml                 # SAM template
├── package.json                  # Shared dependencies
├── samconfig.toml               # SAM configuration
└── src/
    ├── shared/
    │   ├── dynamodb.js          # DynamoDB utilities
    │   ├── response.js          # HTTP response helpers
    │   └── validation.js        # Input validation
    └── functions/
        ├── students/
        │   ├── index.js         # Students handler
        │   └── package.json
        ├── subjects/
        │   ├── index.js         # Subjects handler
        │   └── package.json
        ├── time-entries/
        │   ├── index.js         # Time entries handler
        │   └── package.json
        ├── reports/
        │   ├── index.js         # Reports handler
        │   └── package.json
        └── settings/
            ├── index.js         # Settings handler
            └── package.json
```

---

## Shared Utilities

### `src/shared/dynamodb.js`

```javascript
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

export const getItem = async (tableName, key) => {
  const command = new GetCommand({
    TableName: tableName,
    Key: key,
  });

  const response = await docClient.send(command);
  return response.Item;
};

export const putItem = async (tableName, item) => {
  const command = new PutCommand({
    TableName: tableName,
    Item: item,
  });

  await docClient.send(command);
  return item;
};

export const updateItem = async (tableName, key, updates) => {
  const updateExpression = [];
  const expressionAttributeNames = {};
  const expressionAttributeValues = {};

  Object.keys(updates).forEach((field, index) => {
    const attributeName = `#field${index}`;
    const attributeValue = `:value${index}`;

    updateExpression.push(`${attributeName} = ${attributeValue}`);
    expressionAttributeNames[attributeName] = field;
    expressionAttributeValues[attributeValue] = updates[field];
  });

  const command = new UpdateCommand({
    TableName: tableName,
    Key: key,
    UpdateExpression: `SET ${updateExpression.join(', ')}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW',
  });

  const response = await docClient.send(command);
  return response.Attributes;
};

export const deleteItem = async (tableName, key) => {
  const command = new DeleteCommand({
    TableName: tableName,
    Key: key,
  });

  await docClient.send(command);
};

export const queryItems = async (tableName, keyCondition, indexName = null) => {
  const command = new QueryCommand({
    TableName: tableName,
    IndexName: indexName,
    KeyConditionExpression: keyCondition.expression,
    ExpressionAttributeValues: keyCondition.values,
    ExpressionAttributeNames: keyCondition.names,
  });

  const response = await docClient.send(command);
  return response.Items;
};

export const scanItems = async (tableName, filter = null) => {
  const params = {
    TableName: tableName,
  };

  if (filter) {
    params.FilterExpression = filter.expression;
    params.ExpressionAttributeValues = filter.values;
    params.ExpressionAttributeNames = filter.names;
  }

  const command = new ScanCommand(params);
  const response = await docClient.send(command);
  return response.Items;
};
```

### `src/shared/response.js`

```javascript
export const success = (data, statusCode = 200) => {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify(data),
  };
};

export const error = (message, statusCode = 500) => {
  console.error('Error:', message);

  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify({
      error: message,
    }),
  };
};

export const notFound = (message = 'Resource not found') => {
  return error(message, 404);
};

export const badRequest = (message = 'Bad request') => {
  return error(message, 400);
};

export const unauthorized = (message = 'Unauthorized') => {
  return error(message, 401);
};
```

### `src/shared/validation.js`

```javascript
export const validateRequired = (fields, data) => {
  const missing = [];

  fields.forEach((field) => {
    if (!data[field] && data[field] !== 0 && data[field] !== false) {
      missing.push(field);
    }
  });

  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }
};

export const validateUUID = (uuid) => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(uuid)) {
    throw new Error('Invalid UUID format');
  }
};

export const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return input.trim();
  }
  return input;
};
```

---

## Students Function

### `src/functions/students/index.js`

```javascript
import { randomUUID } from 'crypto';
import { getItem, putItem, updateItem, deleteItem, queryItems } from '../../shared/dynamodb.js';
import { success, error, notFound, badRequest } from '../../shared/response.js';
import { validateRequired, sanitizeInput } from '../../shared/validation.js';

const STUDENTS_TABLE = process.env.STUDENTS_TABLE;

// Get user ID from Cognito authorizer
const getUserId = (event) => {
  return event.requestContext.authorizer.claims.sub;
};

export const handler = async (event) => {
  console.log('Event:', JSON.stringify(event));

  const httpMethod = event.httpMethod;
  const userId = getUserId(event);

  try {
    switch (httpMethod) {
      case 'GET':
        return await handleGet(event, userId);

      case 'POST':
        return await handlePost(event, userId);

      case 'PUT':
        return await handlePut(event, userId);

      case 'DELETE':
        return await handleDelete(event, userId);

      default:
        return badRequest(`Unsupported method: ${httpMethod}`);
    }
  } catch (err) {
    console.error('Error:', err);
    return error(err.message);
  }
};

// GET /students or GET /students/{id}
const handleGet = async (event, userId) => {
  const studentId = event.pathParameters?.id;

  if (studentId) {
    // Get single student
    const student = await getItem(STUDENTS_TABLE, { userId, studentId });

    if (!student) {
      return notFound('Student not found');
    }

    return success(student);
  } else {
    // Get all students for user
    const students = await queryItems(STUDENTS_TABLE, {
      expression: 'userId = :userId',
      values: { ':userId': userId },
    });

    return success(students);
  }
};

// POST /students
const handlePost = async (event, userId) => {
  const body = JSON.parse(event.body);

  // Validate
  validateRequired(['name', 'grade'], body);

  const studentId = randomUUID();
  const timestamp = Date.now();

  const student = {
    userId,
    studentId,
    name: sanitizeInput(body.name),
    grade: sanitizeInput(body.grade),
    birthDate: body.birthDate || null,
    color: body.color || '#3b82f6',
    active: body.active !== undefined ? body.active : true,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await putItem(STUDENTS_TABLE, student);

  return success(student, 201);
};

// PUT /students/{id}
const handlePut = async (event, userId) => {
  const studentId = event.pathParameters?.id;

  if (!studentId) {
    return badRequest('Student ID is required');
  }

  const body = JSON.parse(event.body);

  // Check if student exists and belongs to user
  const existingStudent = await getItem(STUDENTS_TABLE, { userId, studentId });

  if (!existingStudent) {
    return notFound('Student not found');
  }

  // Build updates
  const updates = {
    updatedAt: Date.now(),
  };

  if (body.name) updates.name = sanitizeInput(body.name);
  if (body.grade) updates.grade = sanitizeInput(body.grade);
  if (body.birthDate !== undefined) updates.birthDate = body.birthDate;
  if (body.color) updates.color = body.color;
  if (body.active !== undefined) updates.active = body.active;

  const updatedStudent = await updateItem(
    STUDENTS_TABLE,
    { userId, studentId },
    updates
  );

  return success(updatedStudent);
};

// DELETE /students/{id}
const handleDelete = async (event, userId) => {
  const studentId = event.pathParameters?.id;

  if (!studentId) {
    return badRequest('Student ID is required');
  }

  // Check if student exists and belongs to user
  const existingStudent = await getItem(STUDENTS_TABLE, { userId, studentId });

  if (!existingStudent) {
    return notFound('Student not found');
  }

  await deleteItem(STUDENTS_TABLE, { userId, studentId });

  return success({ message: 'Student deleted successfully' });
};
```

### `src/functions/students/package.json`

```json
{
  "name": "students-function",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.0.0",
    "@aws-sdk/lib-dynamodb": "^3.0.0"
  }
}
```

---

## Subjects Function

### `src/functions/subjects/index.js`

```javascript
import { randomUUID } from 'crypto';
import { getItem, putItem, updateItem, deleteItem, queryItems } from '../../shared/dynamodb.js';
import { success, error, notFound, badRequest } from '../../shared/response.js';
import { validateRequired, sanitizeInput } from '../../shared/validation.js';

const SUBJECTS_TABLE = process.env.SUBJECTS_TABLE;

const getUserId = (event) => {
  return event.requestContext.authorizer.claims.sub;
};

export const handler = async (event) => {
  console.log('Event:', JSON.stringify(event));

  const httpMethod = event.httpMethod;
  const userId = getUserId(event);

  try {
    switch (httpMethod) {
      case 'GET':
        return await handleGet(event, userId);

      case 'POST':
        return await handlePost(event, userId);

      case 'PUT':
        return await handlePut(event, userId);

      case 'DELETE':
        return await handleDelete(event, userId);

      default:
        return badRequest(`Unsupported method: ${httpMethod}`);
    }
  } catch (err) {
    console.error('Error:', err);
    return error(err.message);
  }
};

// GET /subjects or GET /subjects/{id}
const handleGet = async (event, userId) => {
  const subjectId = event.pathParameters?.id;

  if (subjectId) {
    const subject = await getItem(SUBJECTS_TABLE, { userId, subjectId });

    if (!subject) {
      return notFound('Subject not found');
    }

    return success(subject);
  } else {
    const subjects = await queryItems(SUBJECTS_TABLE, {
      expression: 'userId = :userId',
      values: { ':userId': userId },
    });

    return success(subjects);
  }
};

// POST /subjects
const handlePost = async (event, userId) => {
  const body = JSON.parse(event.body);

  validateRequired(['name', 'category'], body);

  const subjectId = randomUUID();
  const timestamp = Date.now();

  const subject = {
    userId,
    subjectId,
    name: sanitizeInput(body.name),
    category: sanitizeInput(body.category),
    color: body.color || '#10b981',
    active: body.active !== undefined ? body.active : true,
    requiredHours: body.requiredHours || null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await putItem(SUBJECTS_TABLE, subject);

  return success(subject, 201);
};

// PUT /subjects/{id}
const handlePut = async (event, userId) => {
  const subjectId = event.pathParameters?.id;

  if (!subjectId) {
    return badRequest('Subject ID is required');
  }

  const body = JSON.parse(event.body);

  const existingSubject = await getItem(SUBJECTS_TABLE, { userId, subjectId });

  if (!existingSubject) {
    return notFound('Subject not found');
  }

  const updates = {
    updatedAt: Date.now(),
  };

  if (body.name) updates.name = sanitizeInput(body.name);
  if (body.category) updates.category = sanitizeInput(body.category);
  if (body.color) updates.color = body.color;
  if (body.active !== undefined) updates.active = body.active;
  if (body.requiredHours !== undefined) updates.requiredHours = body.requiredHours;

  const updatedSubject = await updateItem(
    SUBJECTS_TABLE,
    { userId, subjectId },
    updates
  );

  return success(updatedSubject);
};

// DELETE /subjects/{id}
const handleDelete = async (event, userId) => {
  const subjectId = event.pathParameters?.id;

  if (!subjectId) {
    return badRequest('Subject ID is required');
  }

  const existingSubject = await getItem(SUBJECTS_TABLE, { userId, subjectId });

  if (!existingSubject) {
    return notFound('Subject not found');
  }

  await deleteItem(SUBJECTS_TABLE, { userId, subjectId });

  return success({ message: 'Subject deleted successfully' });
};
```

---

## Time Entries Function

### `src/functions/time-entries/index.js`

```javascript
import { randomUUID } from 'crypto';
import { getItem, putItem, updateItem, deleteItem, queryItems } from '../../shared/dynamodb.js';
import { success, error, notFound, badRequest } from '../../shared/response.js';
import { validateRequired, sanitizeInput } from '../../shared/validation.js';

const TIME_ENTRIES_TABLE = process.env.TIME_ENTRIES_TABLE;

const getUserId = (event) => {
  return event.requestContext.authorizer.claims.sub;
};

export const handler = async (event) => {
  console.log('Event:', JSON.stringify(event));

  const httpMethod = event.httpMethod;
  const userId = getUserId(event);

  try {
    switch (httpMethod) {
      case 'GET':
        return await handleGet(event, userId);

      case 'POST':
        return await handlePost(event, userId);

      case 'PUT':
        return await handlePut(event, userId);

      case 'DELETE':
        return await handleDelete(event, userId);

      default:
        return badRequest(`Unsupported method: ${httpMethod}`);
    }
  } catch (err) {
    console.error('Error:', err);
    return error(err.message);
  }
};

// GET /time-entries?startDate=2024-01-01&endDate=2024-12-31&studentId=xxx&subjectId=xxx
const handleGet = async (event, userId) => {
  const entryId = event.pathParameters?.id;

  if (entryId) {
    const entry = await getItem(TIME_ENTRIES_TABLE, { userId, entryId });

    if (!entry) {
      return notFound('Time entry not found');
    }

    return success(entry);
  } else {
    const queryParams = event.queryStringParameters || {};
    const { startDate, endDate, studentId, subjectId } = queryParams;

    let entries;

    if (studentId) {
      // Query by student
      entries = await queryItems(
        TIME_ENTRIES_TABLE,
        {
          expression: 'userStudent = :userStudent',
          values: { ':userStudent': `${userId}#${studentId}` },
        },
        'StudentIndex'
      );
    } else if (subjectId) {
      // Query by subject
      entries = await queryItems(
        TIME_ENTRIES_TABLE,
        {
          expression: 'userSubject = :userSubject',
          values: { ':userSubject': `${userId}#${subjectId}` },
        },
        'SubjectIndex'
      );
    } else if (startDate || endDate) {
      // Query by date range
      let expression = 'userId = :userId';
      const values = { ':userId': userId };

      if (startDate && endDate) {
        expression += ' AND #date BETWEEN :startDate AND :endDate';
        values[':startDate'] = startDate;
        values[':endDate'] = endDate;
      } else if (startDate) {
        expression += ' AND #date >= :startDate';
        values[':startDate'] = startDate;
      } else if (endDate) {
        expression += ' AND #date <= :endDate';
        values[':endDate'] = endDate;
      }

      entries = await queryItems(
        TIME_ENTRIES_TABLE,
        {
          expression,
          values,
          names: { '#date': 'date' },
        },
        'UserDateIndex'
      );
    } else {
      // Get all entries for user (use with caution on large datasets)
      entries = await queryItems(TIME_ENTRIES_TABLE, {
        expression: 'userId = :userId',
        values: { ':userId': userId },
      });
    }

    return success(entries);
  }
};

// POST /time-entries
const handlePost = async (event, userId) => {
  const body = JSON.parse(event.body);

  validateRequired(['studentId', 'subjectId', 'date', 'hours'], body);

  const entryId = randomUUID();
  const timestamp = Date.now();

  const entry = {
    userId,
    entryId,
    studentId: body.studentId,
    subjectId: body.subjectId,
    date: body.date,
    hours: parseFloat(body.hours),
    minutes: parseInt(body.minutes) || 0,
    notes: sanitizeInput(body.notes) || '',
    userStudent: `${userId}#${body.studentId}`,
    userSubject: `${userId}#${body.subjectId}`,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await putItem(TIME_ENTRIES_TABLE, entry);

  return success(entry, 201);
};

// PUT /time-entries/{id}
const handlePut = async (event, userId) => {
  const entryId = event.pathParameters?.id;

  if (!entryId) {
    return badRequest('Entry ID is required');
  }

  const body = JSON.parse(event.body);

  const existingEntry = await getItem(TIME_ENTRIES_TABLE, { userId, entryId });

  if (!existingEntry) {
    return notFound('Time entry not found');
  }

  const updates = {
    updatedAt: Date.now(),
  };

  if (body.studentId) {
    updates.studentId = body.studentId;
    updates.userStudent = `${userId}#${body.studentId}`;
  }
  if (body.subjectId) {
    updates.subjectId = body.subjectId;
    updates.userSubject = `${userId}#${body.subjectId}`;
  }
  if (body.date) updates.date = body.date;
  if (body.hours !== undefined) updates.hours = parseFloat(body.hours);
  if (body.minutes !== undefined) updates.minutes = parseInt(body.minutes);
  if (body.notes !== undefined) updates.notes = sanitizeInput(body.notes);

  const updatedEntry = await updateItem(
    TIME_ENTRIES_TABLE,
    { userId, entryId },
    updates
  );

  return success(updatedEntry);
};

// DELETE /time-entries/{id}
const handleDelete = async (event, userId) => {
  const entryId = event.pathParameters?.id;

  if (!entryId) {
    return badRequest('Entry ID is required');
  }

  const existingEntry = await getItem(TIME_ENTRIES_TABLE, { userId, entryId });

  if (!existingEntry) {
    return notFound('Time entry not found');
  }

  await deleteItem(TIME_ENTRIES_TABLE, { userId, entryId });

  return success({ message: 'Time entry deleted successfully' });
};
```

---

## Reports Function

### `src/functions/reports/index.js`

```javascript
import { queryItems } from '../../shared/dynamodb.js';
import { success, error } from '../../shared/response.js';

const STUDENTS_TABLE = process.env.STUDENTS_TABLE;
const SUBJECTS_TABLE = process.env.SUBJECTS_TABLE;
const TIME_ENTRIES_TABLE = process.env.TIME_ENTRIES_TABLE;

const getUserId = (event) => {
  return event.requestContext.authorizer.claims.sub;
};

export const handler = async (event) => {
  console.log('Event:', JSON.stringify(event));

  const userId = getUserId(event);
  const path = event.path || event.resource;

  try {
    if (path.includes('/summary')) {
      return await getSummary(userId);
    } else if (path.includes('/by-student')) {
      const studentId = event.queryStringParameters?.studentId;
      return await getByStudent(userId, studentId);
    } else if (path.includes('/by-subject')) {
      const subjectId = event.queryStringParameters?.subjectId;
      return await getBySubject(userId, subjectId);
    } else {
      return error('Unknown report type', 400);
    }
  } catch (err) {
    console.error('Error:', err);
    return error(err.message);
  }
};

// GET /reports/summary
const getSummary = async (userId) => {
  const [students, subjects, timeEntries] = await Promise.all([
    queryItems(STUDENTS_TABLE, {
      expression: 'userId = :userId',
      values: { ':userId': userId },
    }),
    queryItems(SUBJECTS_TABLE, {
      expression: 'userId = :userId',
      values: { ':userId': userId },
    }),
    queryItems(TIME_ENTRIES_TABLE, {
      expression: 'userId = :userId',
      values: { ':userId': userId },
    }),
  ]);

  // Calculate total hours
  const totalHours = timeEntries.reduce((sum, entry) => {
    return sum + (entry.hours || 0) + (entry.minutes || 0) / 60;
  }, 0);

  // Hours by student
  const hoursByStudent = {};
  timeEntries.forEach((entry) => {
    if (!hoursByStudent[entry.studentId]) {
      hoursByStudent[entry.studentId] = 0;
    }
    hoursByStudent[entry.studentId] += (entry.hours || 0) + (entry.minutes || 0) / 60;
  });

  // Hours by subject
  const hoursBySubject = {};
  timeEntries.forEach((entry) => {
    if (!hoursBySubject[entry.subjectId]) {
      hoursBySubject[entry.subjectId] = 0;
    }
    hoursBySubject[entry.subjectId] += (entry.hours || 0) + (entry.minutes || 0) / 60;
  });

  return success({
    totalStudents: students.length,
    totalSubjects: subjects.length,
    totalEntries: timeEntries.length,
    totalHours: Math.round(totalHours * 100) / 100,
    hoursByStudent,
    hoursBySubject,
    students,
    subjects,
  });
};

// GET /reports/by-student?studentId=xxx
const getByStudent = async (userId, studentId) => {
  if (!studentId) {
    return error('studentId is required', 400);
  }

  const entries = await queryItems(
    TIME_ENTRIES_TABLE,
    {
      expression: 'userStudent = :userStudent',
      values: { ':userStudent': `${userId}#${studentId}` },
    },
    'StudentIndex'
  );

  const totalHours = entries.reduce((sum, entry) => {
    return sum + (entry.hours || 0) + (entry.minutes || 0) / 60;
  }, 0);

  const hoursBySubject = {};
  entries.forEach((entry) => {
    if (!hoursBySubject[entry.subjectId]) {
      hoursBySubject[entry.subjectId] = 0;
    }
    hoursBySubject[entry.subjectId] += (entry.hours || 0) + (entry.minutes || 0) / 60;
  });

  return success({
    studentId,
    totalHours: Math.round(totalHours * 100) / 100,
    totalEntries: entries.length,
    hoursBySubject,
    entries,
  });
};

// GET /reports/by-subject?subjectId=xxx
const getBySubject = async (userId, subjectId) => {
  if (!subjectId) {
    return error('subjectId is required', 400);
  }

  const entries = await queryItems(
    TIME_ENTRIES_TABLE,
    {
      expression: 'userSubject = :userSubject',
      values: { ':userSubject': `${userId}#${subjectId}` },
    },
    'SubjectIndex'
  );

  const totalHours = entries.reduce((sum, entry) => {
    return sum + (entry.hours || 0) + (entry.minutes || 0) / 60;
  }, 0);

  const hoursByStudent = {};
  entries.forEach((entry) => {
    if (!hoursByStudent[entry.studentId]) {
      hoursByStudent[entry.studentId] = 0;
    }
    hoursByStudent[entry.studentId] += (entry.hours || 0) + (entry.minutes || 0) / 60;
  });

  return success({
    subjectId,
    totalHours: Math.round(totalHours * 100) / 100,
    totalEntries: entries.length,
    hoursByStudent,
    entries,
  });
};
```

---

## Root package.json (for SAM)

### `backend/package.json`

```json
{
  "name": "homeschool-tracker-backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "build": "sam build",
    "deploy": "sam deploy",
    "deploy:guided": "sam deploy --guided",
    "local": "sam local start-api",
    "logs": "sam logs --tail"
  },
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.0.0",
    "@aws-sdk/lib-dynamodb": "^3.0.0"
  }
}
```

---

## Deployment Commands

```bash
# Initialize backend
cd backend
npm install

# Build SAM application
sam build

# Deploy with guided setup (first time)
sam deploy --guided

# Deploy (subsequent times)
sam deploy

# Test locally
sam local start-api

# View logs
sam logs --tail --stack-name homeschool-tracker-backend

# Delete stack
sam delete
```

---

## Environment Variables in SAM Template

The SAM template automatically sets these environment variables for all functions:

```yaml
Environment:
  Variables:
    REGION: !Ref AWS::Region
    STUDENTS_TABLE: homeschool-students
    SUBJECTS_TABLE: homeschool-subjects
    TIME_ENTRIES_TABLE: homeschool-time-entries
    SETTINGS_TABLE: homeschool-settings
```

---

## Testing Lambda Functions Locally

### Test with SAM Local

```bash
# Start local API Gateway
sam local start-api

# Test endpoint
curl http://127.0.0.1:3000/students \
  -H "Authorization: Bearer test-token"
```

### Test Individual Functions

```bash
# Invoke function directly
sam local invoke StudentsFunction -e events/get-students.json
```

Create test events in `backend/events/`:

**`events/get-students.json`**
```json
{
  "httpMethod": "GET",
  "path": "/students",
  "requestContext": {
    "authorizer": {
      "claims": {
        "sub": "test-user-id"
      }
    }
  }
}
```

---

## Security Best Practices

1. **Input Validation**: Always validate and sanitize user input
2. **Authorization**: Check userId matches token in all operations
3. **Error Messages**: Don't leak sensitive information in errors
4. **Logging**: Log errors but not sensitive data
5. **Rate Limiting**: Configure API Gateway throttling
6. **CORS**: Only allow specific origins in production

---

## Performance Optimization

1. **Cold Start**: Keep functions warm with CloudWatch Events (optional)
2. **Memory**: Tune Lambda memory for optimal cost/performance
3. **Batch Operations**: Use DynamoDB batch operations where possible
4. **Connection Reuse**: Reuse DynamoDB client connections
5. **Caching**: Cache frequently accessed data in function memory

---

## Monitoring

### CloudWatch Metrics to Watch

- Lambda Invocations
- Lambda Errors
- Lambda Duration
- DynamoDB ConsumedReadCapacityUnits
- DynamoDB ConsumedWriteCapacityUnits
- API Gateway 4XXError
- API Gateway 5XXError

### CloudWatch Logs

All Lambda functions automatically log to CloudWatch Logs:
```
/aws/lambda/homeschool-tracker-backend-StudentsFunction-xxxxx
```

---

## Next Steps

1. Implement remaining functions (settings, etc.)
2. Add unit tests
3. Add integration tests
4. Set up CI/CD pipeline
5. Add monitoring dashboards
6. Implement data migration scripts
7. Add backup/restore functionality
