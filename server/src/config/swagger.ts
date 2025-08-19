// Swagger/OpenAPI configuration for API documentation
import swaggerJSDoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'
import { Express } from 'express'
import path from 'path'

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Task Management API',
      version: '1.0.0',
      description: 'A comprehensive task management API (Trello clone) with real-time collaboration features',
      contact: {
        name: 'Task Management API Support',
        email: 'support@taskmanagement.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server'
      },
      {
        url: 'https://api.taskmanagement.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Authorization header using the Bearer scheme'
        }
      },
      schemas: {
        // Error Responses
        ApiError: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'An error occurred'
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'VALIDATION_ERROR'
                },
                message: {
                  type: 'string',
                  example: 'Invalid input provided'
                },
                details: {
                  type: 'object',
                  additionalProperties: true
                }
              }
            },
            meta: {
              type: 'object',
              properties: {
                timestamp: {
                  type: 'string',
                  format: 'date-time'
                },
                requestId: {
                  type: 'string'
                }
              }
            }
          }
        },
        
        // Success Response
        ApiSuccess: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object',
              additionalProperties: true
            },
            message: {
              type: 'string',
              example: 'Operation completed successfully'
            },
            meta: {
              type: 'object',
              properties: {
                timestamp: {
                  type: 'string',
                  format: 'date-time'
                },
                requestId: {
                  type: 'string'
                }
              }
            }
          }
        },

        // Pagination
        Pagination: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              minimum: 1,
              example: 1
            },
            limit: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              example: 20
            },
            total: {
              type: 'integer',
              example: 100
            },
            totalPages: {
              type: 'integer',
              example: 5
            },
            hasNext: {
              type: 'boolean',
              example: true
            },
            hasPrev: {
              type: 'boolean',
              example: false
            }
          }
        },

        // User Schemas
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com'
            },
            fullName: {
              type: 'string',
              nullable: true,
              example: 'John Doe'
            }
          }
        },

        AuthResponse: {
          type: 'object',
          properties: {
            user: {
              $ref: '#/components/schemas/User'
            },
            token: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            },
            expiresIn: {
              type: 'string',
              example: '24h'
            }
          },
          required: ['user', 'token', 'expiresIn']
        },

        LoginRequest: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com'
            },
            password: {
              type: 'string',
              minLength: 8,
              maxLength: 128,
              example: 'securePassword123'
            }
          },
          required: ['email', 'password']
        },

        RegisterRequest: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com'
            },
            password: {
              type: 'string',
              minLength: 8,
              maxLength: 128,
              example: 'securePassword123'
            },
            fullName: {
              type: 'string',
              maxLength: 255,
              example: 'John Doe'
            }
          },
          required: ['email', 'password']
        },

        // Board Schemas
        Board: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000'
            },
            name: {
              type: 'string',
              maxLength: 255,
              example: 'Project Alpha'
            },
            description: {
              type: 'string',
              nullable: true,
              maxLength: 1000,
              example: 'Main project board for Alpha development'
            },
            ownerId: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          },
          required: ['id', 'name', 'ownerId', 'createdAt', 'updatedAt']
        },

        CreateBoardRequest: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              minLength: 1,
              maxLength: 255,
              example: 'Project Alpha'
            },
            description: {
              type: 'string',
              maxLength: 1000,
              example: 'Main project board for Alpha development'
            }
          },
          required: ['name']
        },

        UpdateBoardRequest: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              minLength: 1,
              maxLength: 255,
              example: 'Project Alpha Updated'
            },
            description: {
              type: 'string',
              nullable: true,
              maxLength: 1000,
              example: 'Updated description'
            }
          },
          minProperties: 1
        },

        // List Schemas
        List: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000'
            },
            name: {
              type: 'string',
              maxLength: 255,
              example: 'To Do'
            },
            boardId: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000'
            },
            position: {
              type: 'integer',
              minimum: 0,
              example: 1
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          },
          required: ['id', 'name', 'boardId', 'position', 'createdAt', 'updatedAt']
        },

        CreateListRequest: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              minLength: 1,
              maxLength: 255,
              example: 'To Do'
            },
            boardId: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000'
            },
            position: {
              type: 'integer',
              minimum: 0,
              example: 1
            }
          },
          required: ['name', 'boardId']
        },

        // Task Schemas
        Task: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000'
            },
            title: {
              type: 'string',
              maxLength: 255,
              example: 'Implement user authentication'
            },
            description: {
              type: 'string',
              nullable: true,
              maxLength: 1000,
              example: 'Add JWT-based authentication system'
            },
            listId: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000'
            },
            dueDate: {
              type: 'string',
              format: 'date',
              nullable: true,
              example: '2024-12-31'
            },
            position: {
              type: 'integer',
              minimum: 0,
              example: 1
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            },
            labels: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: {
                    type: 'string',
                    format: 'uuid'
                  },
                  name: {
                    type: 'string',
                    maxLength: 255
                  },
                  color: {
                    type: 'string',
                    pattern: '^#[0-9A-Fa-f]{6}$'
                  }
                }
              }
            }
          },
          required: ['id', 'title', 'listId', 'position', 'createdAt', 'updatedAt']
        },

        CreateTaskRequest: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              minLength: 1,
              maxLength: 255,
              example: 'Implement user authentication'
            },
            description: {
              type: 'string',
              maxLength: 1000,
              example: 'Add JWT-based authentication system'
            },
            listId: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000'
            },
            dueDate: {
              type: 'string',
              format: 'date',
              example: '2024-12-31'
            },
            position: {
              type: 'integer',
              minimum: 0,
              example: 1
            }
          },
          required: ['title', 'listId']
        },

        // Real-time WebSocket Schemas
        WebSocketMessage: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['board_update', 'list_update', 'task_update', 'user_activity', 'error', 'subscription_confirmed', 'pong', 'connection']
            },
            payload: {
              type: 'object',
              additionalProperties: true
            },
            boardId: {
              type: 'string',
              format: 'uuid'
            },
            userId: {
              type: 'string',
              format: 'uuid'
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            }
          },
          required: ['type', 'timestamp']
        }
      },
      parameters: {
        BoardId: {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Board ID',
          schema: {
            type: 'string',
            format: 'uuid'
          }
        },
        ListId: {
          name: 'id',
          in: 'path',
          required: true,
          description: 'List ID',
          schema: {
            type: 'string',
            format: 'uuid'
          }
        },
        TaskId: {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Task ID',
          schema: {
            type: 'string',
            format: 'uuid'
          }
        },
        Page: {
          name: 'page',
          in: 'query',
          description: 'Page number for pagination',
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1
          }
        },
        Limit: {
          name: 'limit',
          in: 'query',
          description: 'Number of items per page',
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 20
          }
        }
      },
      responses: {
        Success: {
          description: 'Successful response',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ApiSuccess'
              }
            }
          }
        },
        Created: {
          description: 'Resource created successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ApiSuccess'
              }
            }
          }
        },
        BadRequest: {
          description: 'Bad request - validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ApiError'
              }
            }
          }
        },
        Unauthorized: {
          description: 'Unauthorized - invalid or missing authentication',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ApiError'
              }
            }
          }
        },
        Forbidden: {
          description: 'Forbidden - insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ApiError'
              }
            }
          }
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ApiError'
              }
            }
          }
        },
        Conflict: {
          description: 'Conflict - resource already exists',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ApiError'
              }
            }
          }
        },
        InternalServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ApiError'
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization operations'
      },
      {
        name: 'Boards',
        description: 'Board management operations'
      },
      {
        name: 'Lists',
        description: 'List management operations within boards'
      },
      {
        name: 'Tasks',
        description: 'Task management operations within lists'
      },
      {
        name: 'Real-time',
        description: 'WebSocket real-time collaboration'
      }
    ]
  },
  apis: [
    path.join(__dirname, '../routes/*.ts'),
    path.join(__dirname, '../middleware/*.ts')
  ]
}

export const specs = swaggerJSDoc(options)

export const setupSwagger = (app: Express): void => {
  // Swagger UI setup
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    customSiteTitle: 'Task Management API Documentation',
    customfavIcon: '/favicon.ico',
    customCssUrl: '/swagger-ui-custom.css',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true
    }
  }))

  // JSON endpoint for OpenAPI spec
  app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json')
    res.send(specs)
  })
}