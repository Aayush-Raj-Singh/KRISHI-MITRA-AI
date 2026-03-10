# Design Document: KrishiMitra-AI

## System Overview

KrishiMitra-AI is a cloud-native, AI-powered rural decision intelligence platform built on AWS infrastructure. The system employs a microservices architecture with distinct layers for presentation, business logic, AI/ML processing, and data persistence. The platform integrates machine learning models for predictive analytics (crop recommendation, price forecasting) with Amazon Bedrock for generative AI capabilities, delivering personalized agricultural advisory services to rural farmers across India.

The architecture prioritizes scalability, multilingual support, offline capabilities, and cost efficiency while maintaining high availability during critical agricultural periods. The system processes structured agricultural data (soil parameters, weather, prices) and unstructured user queries through specialized AI pipelines, transforming raw data into actionable intelligence.

---

## High-Level Architecture

### Architecture Diagram (Conceptual)

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│  ┌──────────────────┐              ┌──────────────────┐         │
│  │   Web Frontend   │              │ Mobile Frontend  │         │
│  │     (React)      │              │ (React Native)   │         │
│  └──────────────────┘              └──────────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AWS CLOUD LAYER                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              API Gateway + Load Balancer                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            │                                    │
│  ┌─────────────────────────┴────────────────────────────────┐   │
│  │                  Backend API Layer                       │   │
│  │              (FastAPI on EC2/ECS)                        │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────-┐               │   │
│  │  │   Auth   │  │   User   │  │  Advisory │               │   │
│  │  │ Service  │  │ Service  │  │  Service  │               │   │
│  │  └──────────┘  └──────────┘  └─────-─────┘               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            │                                    │
│  ┌─────────────────────────┴────────────────────────────────┐   │
│  │                   AI/ML Layer                            │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │   │
│  │  │    Crop      │  │    Price     │  │    Water     │    │   │
│  │  │ Recommender  │  │  Forecaster  │  │  Optimizer   │    │   │
│  │  │  (SageMaker) │  │  (SageMaker) │  │  (Lambda)    │    │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘    │   │
│  │                                                          │   │
│  │  ┌──────────────────────────────────────────────────┐    │   │
│  │  │         Amazon Bedrock (Claude/Titan)            │    │   │
│  │  │         Multilingual AI Advisory                 │    │   │
│  │  └──────────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            │                                    │
│  ┌─────────────────────────┴────────────────────────────────┐   │
│  │                   Data Layer                             │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │   │
│  │  │   MongoDB    │  │   S3 Bucket  │  │  ElastiCache │    │   │
│  │  │  (Atlas)     │  │  (ML Models, │  │   (Redis)    │    │   │
│  │  │              │  │   Datasets)  │  │              │    │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              External Integrations                       │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │   │
│  │  │   Weather    │  │    Mandi     │  │  Translation │    │   │
│  │  │     API      │  │  Price API   │  │     API      │    │   │
│  │  │    (IMD)     │  │ (Agmarknet)  │  │              │    │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         Monitoring & Logging Layer                       │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │   │
│  │  │  CloudWatch  │  │  CloudTrail  │  │   X-Ray      │    │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘    │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Architecture Principles

1. **Microservices Architecture**: Loosely coupled services for independent scaling and deployment
2. **API-First Design**: RESTful APIs with OpenAPI specification for all backend services
3. **Cloud-Native**: Leverages AWS managed services to minimize operational overhead
4. **Event-Driven**: Asynchronous processing for ML inference and data updates
5. **Multilingual by Design**: Language detection and translation integrated at all layers
6. **Offline-First Mobile**: Progressive Web App (PWA) capabilities with local caching
7. **Security by Default**: Zero-trust architecture with encryption at rest and in transit

---

## Detailed Component Design

### 1. Frontend Layer

#### 1.1 Web Frontend (React)

**Technology Stack**:
- React 18 with TypeScript
- Material-UI (MUI) for component library
- Redux Toolkit for state management
- React Query for API data fetching and caching
- i18next for internationalization
- Chart.js for data visualization
- PWA capabilities with service workers

**Key Features**:
- Responsive design optimized for mobile and desktop
- Multilingual interface with dynamic language switching
- Offline mode with service worker caching
- Voice input using Web Speech API
- Real-time updates using WebSocket connections
- Accessibility compliance (ARIA labels, keyboard navigation)

**Module Structure**:
```
src/
├── components/
│   ├── auth/           # Login, registration components
│   ├── dashboard/      # User dashboard, metrics
│   ├── recommendations/ # Crop, price, water recommendations
│   ├── advisory/       # AI chat interface
│   └── common/         # Reusable UI components
├── services/
│   ├── api.ts          # API client configuration
│   ├── auth.ts         # Authentication service
│   └── cache.ts        # Offline caching logic
├── store/              # Redux state management
├── locales/            # Translation files (9 languages)
└── utils/              # Helper functions
```


#### 1.2 Mobile Frontend (React Native)

**Technology Stack**:
- React Native 0.72+
- React Navigation for routing
- Redux Toolkit for state management
- AsyncStorage for local data persistence
- React Native Voice for voice input
- React Native Maps for location services
- Push notifications using Firebase Cloud Messaging

**Key Features**:
- Native performance on Android and iOS
- Offline-first architecture with local SQLite database
- Background sync when connectivity is restored
- Camera integration for soil/crop image capture (future enhancement)
- GPS-based location detection for weather and market data
- Low-bandwidth mode for rural connectivity

**Module Structure**:
```
src/
├── screens/
│   ├── AuthScreens/
│   ├── DashboardScreens/
│   ├── RecommendationScreens/
│   └── AdvisoryScreens/
├── navigation/
├── services/
│   ├── api/
│   ├── storage/
│   └── sync/
├── components/
└── locales/
```

---

### 2. Backend API Layer

#### 2.1 API Gateway Architecture

**Technology**: AWS API Gateway + Application Load Balancer

**Features**:
- RESTful API endpoints with versioning (v1, v2)
- Request validation and transformation
- Rate limiting (100 requests/minute per user)
- API key management for external integrations
- CORS configuration for web clients
- Request/response logging to CloudWatch

**Endpoint Structure**:
```
/api/v1/
├── /auth
│   ├── POST /register
│   ├── POST /login
│   ├── POST /refresh-token
│   └── POST /reset-password
├── /users
│   ├── GET /profile
│   ├── PUT /profile
│   └── GET /farm-profile
├── /recommendations
│   ├── POST /crop
│   ├── POST /price-forecast
│   └── POST /water-optimization
├── /advisory
│   ├── POST /chat
│   └── GET /history
├── /feedback
│   ├── POST /rating
│   └── POST /outcome
├── /dashboard
│   ├── GET /metrics
│   └── GET /regional-insights
└── /data
    ├── GET /weather
    └── GET /market-prices
```

#### 2.2 Backend Services (FastAPI)

**Technology Stack**:
- FastAPI (Python 3.11+)
- Pydantic for data validation
- SQLAlchemy for ORM (if needed)
- Motor for async MongoDB operations
- Celery for background task processing
- Redis for caching and session management
- JWT for authentication

**Service Architecture**:

**Auth Service**:
- User registration and authentication
- JWT token generation and validation
- Role-based access control (Farmer, Extension Officer, Admin)
- Password hashing using bcrypt
- Multi-factor authentication (SMS OTP)

**User Service**:
- User profile management
- Farm profile data (soil type, crops, location)
- Preference management (language, notification settings)
- User activity tracking

**Recommendation Service**:
- Orchestrates ML model inference
- Caches recent predictions
- Formats and enriches model outputs
- Handles batch recommendation requests

**Advisory Service**:
- Manages conversation context
- Integrates with Amazon Bedrock
- Implements conversation history
- Handles multilingual translation

**Data Integration Service**:
- Fetches weather data from external APIs
- Fetches mandi price data
- Validates and normalizes external data
- Schedules periodic data updates

**Feedback Service**:
- Collects user ratings and feedback
- Stores actual farming outcomes
- Triggers model retraining pipelines


**Deployment**:
- Containerized using Docker
- Deployed on AWS ECS (Elastic Container Service) with Fargate
- Auto-scaling based on CPU/memory utilization
- Health checks and automatic recovery
- Blue-green deployment for zero-downtime updates

---

### 3. AI/ML Layer

#### 3.1 Crop Recommendation Engine

**Model Architecture**:
- Primary Model: XGBoost Classifier
- Backup Model: Random Forest Classifier
- Ensemble approach for improved accuracy

**Input Features** (15 features):
- Soil parameters: N, P, K levels, pH, organic carbon
- Climate data: Temperature (min, max, avg), humidity, rainfall
- Location: Latitude, longitude, agro-climatic zone
- Temporal: Month, season
- Historical: Previous crop yield (if available)

**Output**:
- Top 3 crop recommendations with confidence scores
- Explanation of key factors influencing recommendation

**Training Pipeline**:
1. Data collection from agricultural datasets (Kaggle, government sources)
2. Feature engineering and normalization
3. Train-test split (80-20) with stratification
4. Hyperparameter tuning using Optuna
5. Model evaluation (accuracy, F1-score, confusion matrix)
6. Model serialization and versioning
7. Deployment to SageMaker endpoint

**Inference Pipeline**:
1. Receive user input via API
2. Validate and preprocess features
3. Call SageMaker endpoint
4. Post-process predictions (add explanations)
5. Cache results for 24 hours
6. Return formatted response

**Model Monitoring**:
- Track prediction distribution drift
- Monitor inference latency
- Compare predictions against actual outcomes
- Trigger retraining when accuracy drops below 75%

#### 3.2 Price Forecasting Engine

**Model Architecture**:
- Primary Model: LSTM (Long Short-Term Memory) Neural Network
- Backup Model: Prophet (Facebook's time-series forecasting)
- Separate models for each major crop and market combination

**Input Features**:
- Historical daily prices (past 365 days)
- Seasonal indicators (month, week, festival periods)
- Weather forecasts (rainfall, temperature)
- Supply indicators (sowing area, production estimates)
- External factors (fuel prices, policy changes)

**Output**:
- Daily price predictions for 30, 60, 90 days
- Confidence intervals (80%, 95%)
- Trend indicators (bullish, bearish, stable)

**Training Pipeline**:
1. Collect historical mandi price data (5+ years)
2. Handle missing values and outliers
3. Feature engineering (moving averages, lag features)
4. Sequence generation for LSTM (window size: 30 days)
5. Train separate models for top 20 crops
6. Validate using walk-forward validation
7. Evaluate using MAPE, RMSE, directional accuracy
8. Deploy to SageMaker endpoint

**Inference Pipeline**:
1. Receive crop and market selection
2. Fetch latest price data and weather forecasts
3. Prepare input sequences
4. Call appropriate SageMaker endpoint
5. Generate confidence intervals
6. Visualize predictions with historical context
7. Cache forecasts for 7 days

**Model Monitoring**:
- Compare predictions against actual prices weekly
- Calculate rolling MAPE
- Retrain models quarterly or when MAPE exceeds 15%


#### 3.3 Water Optimization Engine

**Approach**: Rule-based system enhanced with weather forecasting

**Input Parameters**:
- Crop type and growth stage
- Soil type and moisture level
- Weather forecast (rainfall, temperature, humidity)
- Water source type (borewell, canal, rainwater)
- Farm size and irrigation method

**Logic**:
1. Lookup crop water requirements from agricultural database
2. Adjust for growth stage (seedling, vegetative, flowering, maturity)
3. Calculate evapotranspiration (ET) using Penman-Monteith equation
4. Factor in soil moisture retention capacity
5. Incorporate rainfall predictions
6. Generate irrigation schedule (frequency, duration, volume)

**Output**:
- Recommended irrigation schedule (next 7 days)
- Estimated water volume required
- Potential water savings vs. traditional methods
- Alerts for predicted rainfall

**Implementation**:
- Deployed as AWS Lambda function (Python)
- Triggered via API Gateway
- Uses cached weather forecasts
- Response time < 1 second

#### 3.4 Sustainability Scoring Engine

**Scoring Algorithm**:

**Water Efficiency Score** (0-100):
- Actual water usage vs. optimal usage
- Irrigation method efficiency
- Rainfall utilization

**Fertilizer Efficiency Score** (0-100):
- NPK application vs. soil test recommendations
- Organic vs. chemical fertilizer ratio
- Timing of application

**Yield Optimization Score** (0-100):
- Actual yield vs. regional average
- Actual yield vs. potential yield for soil/climate
- Crop selection appropriateness

**Overall Sustainability Score**:
- Weighted average: Water (40%), Fertilizer (30%), Yield (30%)
- Benchmarked against regional best practices
- Tracked over multiple farming cycles

**Implementation**:
- Calculated post-harvest when user reports outcomes
- Stored in MongoDB for trend analysis
- Visualized in dashboard with improvement suggestions

---

### 4. Amazon Bedrock Integration

#### 4.1 Multilingual AI Advisory

**Model Selection**:
- Primary: Anthropic Claude 3 (Sonnet or Haiku for cost optimization)
- Backup: Amazon Titan Text

**Prompt Engineering**:

**System Prompt Template**:
```
You are KrishiMitra, an expert agricultural advisor for Indian farmers. 
You provide practical, actionable advice based on scientific principles 
and local farming practices.

User Context:
- Name: {user_name}
- Location: {location}
- Farm Size: {farm_size} acres
- Soil Type: {soil_type}
- Primary Crops: {crops}
- Language: {language}

Guidelines:
- Respond in {language} language
- Use simple, farmer-friendly terminology
- Provide specific, actionable recommendations
- Cite sources when providing factual information
- If uncertain, acknowledge limitations
- Consider local climate and cultural practices
```

**User Query Processing**:
1. Detect user language (if not specified)
2. Translate query to English (if needed) using AWS Translate
3. Retrieve user context from database
4. Retrieve relevant agricultural knowledge (RAG approach)
5. Construct prompt with context
6. Call Bedrock API with temperature=0.7
7. Translate response back to user language
8. Store conversation in history

**Knowledge Augmentation (RAG)**:
- Maintain vector database of agricultural knowledge
- Use Amazon OpenSearch for semantic search
- Embed user query and retrieve top 5 relevant documents
- Include retrieved context in Bedrock prompt
- Sources: Government guidelines, research papers, best practices


**Conversation Management**:
- Store conversation history in MongoDB
- Maintain context window of last 5 exchanges
- Implement conversation summarization for long threads
- Allow users to start new conversation threads

**Cost Optimization**:
- Use Claude Haiku for simple queries (classification, factual Q&A)
- Use Claude Sonnet for complex advisory (multi-step reasoning)
- Implement caching for frequently asked questions
- Set token limits (max 1000 tokens per response)

**Safety and Compliance**:
- Content filtering to prevent harmful advice
- Disclaimer that AI advice is supplementary, not replacement for expert consultation
- Logging all interactions for quality assurance
- Human review of flagged conversations

---

### 5. Database Design

#### 5.1 MongoDB Schema

**Users Collection**:
```json
{
  "_id": "ObjectId",
  "phone": "string (unique, indexed)",
  "name": "string",
  "email": "string (optional)",
  "password_hash": "string",
  "role": "enum (farmer, extension_officer, admin)",
  "language": "string",
  "created_at": "datetime",
  "last_login": "datetime",
  "farm_profile": {
    "location": {
      "latitude": "float",
      "longitude": "float",
      "state": "string",
      "district": "string",
      "village": "string"
    },
    "farm_size": "float (acres)",
    "soil_type": "string",
    "water_source": "enum",
    "primary_crops": ["string"],
    "irrigation_method": "string"
  },
  "preferences": {
    "notifications": "boolean",
    "voice_input": "boolean"
  }
}
```

**Recommendations Collection**:
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId (indexed)",
  "type": "enum (crop, price, water)",
  "timestamp": "datetime (indexed)",
  "input_data": {
    "soil": {...},
    "climate": {...},
    "location": {...}
  },
  "predictions": [
    {
      "crop": "string",
      "confidence": "float",
      "explanation": "string"
    }
  ],
  "model_version": "string",
  "feedback": {
    "rating": "int (1-5)",
    "adopted": "boolean",
    "outcome": "string"
  }
}
```

**Conversations Collection**:
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId (indexed)",
  "thread_id": "string",
  "messages": [
    {
      "role": "enum (user, assistant)",
      "content": "string",
      "language": "string",
      "timestamp": "datetime"
    }
  ],
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

**Outcomes Collection**:
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId (indexed)",
  "season": "string",
  "year": "int",
  "crop": "string",
  "recommendation_id": "ObjectId",
  "actual_yield": "float",
  "actual_income": "float",
  "water_used": "float",
  "fertilizer_used": {...},
  "sustainability_score": "float",
  "reported_at": "datetime"
}
```

**Market Prices Collection** (Time-series):
```json
{
  "_id": "ObjectId",
  "crop": "string (indexed)",
  "market": "string (indexed)",
  "date": "date (indexed)",
  "price": "float",
  "volume": "float",
  "source": "string"
}
```

**Weather Data Collection** (Time-series):
```json
{
  "_id": "ObjectId",
  "location": {
    "latitude": "float",
    "longitude": "float"
  },
  "date": "date (indexed)",
  "temperature": {...},
  "humidity": "float",
  "rainfall": "float",
  "forecast": "boolean"
}
```

#### 5.2 Indexing Strategy

- Compound index on `user_id` + `timestamp` for recommendations
- Geospatial index on location fields for proximity queries
- Text index on conversation content for search
- TTL index on cached data (weather, prices) for automatic cleanup

#### 5.3 Data Partitioning

- Partition by agro-climatic zone for regional queries
- Separate collections for historical vs. real-time data
- Archive old data (>2 years) to S3 for cost optimization


---

## Data Flow Description

### 1. User Registration Flow

```
User (Mobile/Web) 
  → API Gateway 
  → Auth Service 
  → Validate input 
  → Hash password 
  → Store in MongoDB 
  → Generate JWT token 
  → Return token to client
```

### 2. Crop Recommendation Flow

```
User submits soil/climate data 
  → API Gateway 
  → Recommendation Service 
  → Check Redis cache (key: hash of input) 
  → If cache miss:
      → Validate and preprocess input 
      → Call SageMaker endpoint 
      → Receive predictions 
      → Enrich with explanations 
      → Store in MongoDB 
      → Cache in Redis (TTL: 24h) 
  → Return recommendations to client
```

### 3. Price Forecast Flow

```
User selects crop and market 
  → API Gateway 
  → Recommendation Service 
  → Check Redis cache 
  → If cache miss:
      → Fetch latest price data from MongoDB 
      → Fetch weather forecast from cache/API 
      → Prepare input sequence 
      → Call SageMaker endpoint 
      → Generate confidence intervals 
      → Store forecast in MongoDB 
      → Cache in Redis (TTL: 7 days) 
  → Return forecast with visualization data
```

### 4. AI Advisory Flow

```
User asks question in regional language 
  → API Gateway 
  → Advisory Service 
  → Detect language 
  → Retrieve user context from MongoDB 
  → Retrieve conversation history 
  → If non-English: Translate query using AWS Translate 
  → Perform semantic search in knowledge base (OpenSearch) 
  → Construct prompt with context + knowledge 
  → Call Amazon Bedrock API 
  → Receive response 
  → If non-English: Translate response back 
  → Store conversation in MongoDB 
  → Return response to client
```

### 5. Feedback and Learning Flow

```
User provides feedback/outcome 
  → API Gateway 
  → Feedback Service 
  → Store in MongoDB 
  → Trigger async job (Celery) 
  → Aggregate feedback data 
  → If threshold met (e.g., 1000 new outcomes):
      → Trigger model retraining pipeline 
      → Fetch training data from MongoDB + S3 
      → Train updated model 
      → Evaluate performance 
      → If improved: Deploy to SageMaker 
      → Update model version 
  → Send notification to admin
```

### 6. Data Synchronization Flow (Mobile Offline)

```
Mobile app loses connectivity 
  → Store user actions in local SQLite 
  → Queue API requests 
  → Continue showing cached data 
  
Connectivity restored 
  → Background sync service activates 
  → Upload queued requests to API 
  → Fetch latest data 
  → Update local cache 
  → Notify user of sync completion
```

---

## AI Workflow

### Model Training Workflow

#### Phase 1: Data Collection and Preparation

1. **Data Sources**:
   - Historical agricultural datasets (Kaggle, government portals)
   - User-generated data (feedback, outcomes)
   - External APIs (weather, prices)

2. **Data Pipeline**:
   - Extract data from multiple sources
   - Load into S3 data lake
   - Clean and validate (handle missing values, outliers)
   - Feature engineering (derived features, encoding)
   - Split into train/validation/test sets
   - Store processed data in S3

3. **Tools**:
   - AWS Glue for ETL
   - Pandas, NumPy for processing
   - S3 for storage

#### Phase 2: Model Training

1. **Experiment Tracking**:
   - Use MLflow or SageMaker Experiments
   - Track hyperparameters, metrics, artifacts
   - Version datasets and models

2. **Training Process**:
   - Launch SageMaker training jobs
   - Use spot instances for cost optimization
   - Hyperparameter tuning with SageMaker Automatic Model Tuning
   - Cross-validation for robust evaluation

3. **Model Evaluation**:
   - Calculate metrics (accuracy, F1, MAPE, RMSE)
   - Generate confusion matrices, residual plots
   - Compare against baseline and previous versions
   - Validate on held-out test set

4. **Model Registry**:
   - Store trained models in S3
   - Register in SageMaker Model Registry
   - Tag with version, metrics, training date
   - Approve for deployment


#### Phase 3: Model Deployment

1. **Deployment Strategy**:
   - Deploy to SageMaker endpoint
   - Use multi-model endpoints for cost efficiency
   - Configure auto-scaling (min: 1, max: 10 instances)
   - Set up A/B testing for new model versions

2. **Endpoint Configuration**:
   - Instance type: ml.t3.medium (for inference)
   - Enable data capture for monitoring
   - Set up endpoint monitoring alarms

3. **Rollback Plan**:
   - Maintain previous model version
   - Monitor performance metrics for 48 hours
   - Automatic rollback if error rate > 5%

### Inference Pipeline

```
API Request 
  → Input Validation 
  → Feature Preprocessing 
  → Model Inference (SageMaker) 
  → Post-processing 
  → Response Formatting 
  → Caching 
  → Return to Client
```

**Optimization Techniques**:
- Batch inference for bulk requests
- Model quantization for faster inference
- Caching frequent predictions
- Async inference for non-urgent requests

### Context Passing to Bedrock

**Context Assembly**:
1. Retrieve user profile (location, crops, soil type)
2. Retrieve recent recommendations
3. Retrieve conversation history (last 5 exchanges)
4. Perform semantic search in knowledge base
5. Construct structured prompt

**Prompt Template**:
```python
prompt = f"""
System: {system_prompt}

User Context:
- Location: {user.location}
- Farm Size: {user.farm_size} acres
- Soil Type: {user.soil_type}
- Primary Crops: {', '.join(user.crops)}

Recent Recommendations:
{format_recommendations(recent_recs)}

Relevant Knowledge:
{format_knowledge(retrieved_docs)}

Conversation History:
{format_history(conversation)}

User Query: {user_query}


Response:
"""

response = bedrock.invoke_model(
    modelId="anthropic.claude-3-sonnet-20240229-v1:0",
    body={
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 1000,
        "temperature": 0.7,
        "messages": [
            {"role": "user", "content": prompt}
        ]
    }
)
```

**Context Optimization**:
- Limit context to 4000 tokens to control costs
- Prioritize recent and relevant information
- Summarize long conversation histories
- Cache common context patterns

---

## AWS Services Architecture

### Core Services

#### 1. Amazon EC2 / ECS (Elastic Container Service)

**Purpose**: Host backend API services

**Configuration**:
- ECS Cluster with Fargate launch type (serverless containers)
- Task Definition: 2 vCPU, 4 GB RAM per task
- Auto-scaling: Target CPU utilization 70%
- Min tasks: 2, Max tasks: 20
- Load balancer: Application Load Balancer (ALB)

**Cost Optimization**:
- Use Fargate Spot for non-critical workloads
- Right-size containers based on monitoring
- Schedule scaling for predictable traffic patterns

#### 2. Amazon S3

**Purpose**: Object storage for ML models, datasets, and static assets

**Bucket Structure**:
```
krishimitra-data/
├── models/
│   ├── crop-recommender/
│   │   ├── v1.0/
│   │   └── v2.0/
│   └── price-forecaster/
├── datasets/
│   ├── training/
│   ├── validation/
│   └── archived/
├── static/
│   ├── images/
│   └── documents/
└── logs/
```

**Configuration**:
- Versioning enabled for models
- Lifecycle policies: Move to Glacier after 90 days
- Server-side encryption (SSE-S3)
- Cross-region replication for disaster recovery

#### 3. Amazon SageMaker

**Purpose**: ML model training and inference

**Components**:
- **Training Jobs**: On-demand training with spot instances
- **Endpoints**: Real-time inference for crop and price models
- **Model Registry**: Version control for models
- **Experiments**: Track training runs

**Endpoint Configuration**:
- Crop Recommender: ml.t3.medium, auto-scaling 1-5 instances
- Price Forecaster: ml.t3.medium, auto-scaling 1-5 instances
- Multi-model endpoint for cost efficiency

#### 4. Amazon Bedrock

**Purpose**: Generative AI for multilingual advisory

**Configuration**:
- Model: Anthropic Claude 3 Sonnet
- Fallback: Amazon Titan Text
- On-demand pricing (pay per token)
- Guardrails configured for content filtering

**Usage Patterns**:
- Average 500 tokens per request
- Estimated 10,000 requests/day
- Cost: ~$0.015 per request = $150/day

#### 5. Amazon API Gateway

**Purpose**: API management and routing

**Configuration**:
- REST API with regional endpoint
- Request validation using JSON schemas
- Rate limiting: 100 requests/minute per user
- API keys for external integrations
- CloudWatch logging enabled

#### 6. Amazon ElastiCache (Redis)

**Purpose**: Caching and session management

**Configuration**:
- Redis 7.0
- Node type: cache.t3.medium
- Cluster mode enabled (3 shards, 1 replica each)
- Automatic failover enabled

**Cache Strategy**:
- Crop recommendations: TTL 24 hours
- Price forecasts: TTL 7 days
- Weather data: TTL 6 hours
- User sessions: TTL 30 days

#### 7. Amazon CloudWatch

**Purpose**: Monitoring, logging, and alerting

**Metrics Tracked**:
- API latency (p50, p95, p99)
- Error rates (4xx, 5xx)
- ML inference latency
- Database query performance
- Cache hit rates
- Bedrock token usage

**Alarms**:
- API error rate > 5%
- Inference latency > 5 seconds
- Database connection pool exhaustion
- Disk usage > 80%

**Dashboards**:
- Real-time system health
- User activity metrics
- ML model performance
- Cost tracking

#### 8. AWS Lambda

**Purpose**: Serverless functions for event-driven tasks

**Use Cases**:
- Water optimization calculations
- Data validation and transformation
- Scheduled data fetching (weather, prices)
- Image processing (future feature)
- Notification delivery

**Configuration**:
- Runtime: Python 3.11
- Memory: 512 MB - 1 GB
- Timeout: 30 seconds
- Concurrency limit: 100


#### 9. Amazon EventBridge

**Purpose**: Event-driven architecture

**Event Rules**:
- Daily weather data fetch (6 AM IST)
- Daily mandi price update (8 AM IST)
- Weekly model performance evaluation
- Monthly model retraining trigger

#### 10. AWS Secrets Manager

**Purpose**: Secure credential storage

**Secrets Stored**:
- Database connection strings
- API keys (weather, mandi, translation)
- JWT signing keys
- Bedrock access credentials

#### 11. Amazon CloudFront

**Purpose**: CDN for static assets and API acceleration

**Configuration**:
- Origin: S3 bucket for static assets
- Edge locations: Global distribution
- HTTPS only
- Caching policy: 24 hours for static assets

#### 12. AWS Certificate Manager (ACM)

**Purpose**: SSL/TLS certificates

**Configuration**:
- Wildcard certificate for *.krishimitra.ai
- Automatic renewal
- Integration with CloudFront and ALB

#### 13. Amazon Route 53

**Purpose**: DNS management

**Configuration**:
- Hosted zone for krishimitra.ai
- Health checks for failover
- Latency-based routing for multi-region

#### 14. AWS IAM

**Purpose**: Identity and access management

**Policies**:
- Least privilege access for services
- Role-based access for ECS tasks
- MFA required for admin access
- Service-linked roles for AWS services

---

## Scalability & Performance Design

### Horizontal Scaling Strategy

1. **API Layer**:
   - ECS auto-scaling based on CPU/memory
   - Target tracking: 70% CPU utilization
   - Scale out: Add 2 tasks when threshold exceeded
   - Scale in: Remove 1 task when below threshold for 5 minutes
   - Max tasks: 20 (supports ~10,000 concurrent users)

2. **Database Layer**:
   - MongoDB Atlas with auto-scaling
   - Vertical scaling: M10 → M30 → M50
   - Horizontal scaling: Sharding by agro-climatic zone
   - Read replicas for read-heavy workloads

3. **ML Inference**:
   - SageMaker endpoint auto-scaling
   - Target: 1000 invocations per instance
   - Scale out when invocations > threshold
   - Multi-model endpoints for cost efficiency

4. **Caching Layer**:
   - Redis cluster with 3 shards
   - Add shards as data volume grows
   - Read replicas for read-heavy patterns

### Performance Optimization

1. **API Response Time**:
   - Target: < 3 seconds for 95% of requests
   - Techniques:
     - Redis caching for frequent queries
     - Database query optimization (indexes)
     - Async processing for non-urgent tasks
     - Connection pooling
     - Compression (gzip)

2. **ML Inference Latency**:
   - Target: < 2 seconds for predictions
   - Techniques:
     - Model optimization (quantization)
     - Batch inference for bulk requests
     - Warm endpoints (avoid cold starts)
     - Caching predictions

3. **Database Performance**:
   - Compound indexes on frequent queries
   - Aggregation pipeline optimization
   - Connection pooling (max 100 connections)
   - Query result caching

4. **Frontend Performance**:
   - Code splitting and lazy loading
   - Image optimization (WebP format)
   - Service worker caching
   - CDN for static assets
   - Minification and bundling

### Load Testing Strategy

1. **Tools**: Apache JMeter, Locust
2. **Scenarios**:
   - Normal load: 1,000 concurrent users
   - Peak load: 5,000 concurrent users
   - Stress test: 10,000 concurrent users
3. **Metrics**: Response time, throughput, error rate
4. **Frequency**: Before major releases

---

## Security Design Considerations

### Authentication & Authorization

1. **User Authentication**:
   - JWT tokens with 24-hour expiry
   - Refresh tokens with 30-day expiry
   - Password hashing: bcrypt (cost factor 12)
   - Multi-factor authentication via SMS OTP
   - Account lockout after 5 failed attempts

2. **Authorization**:
   - Role-based access control (RBAC)
   - Roles: Farmer, Extension Officer, Admin
   - API endpoint permissions per role
   - Resource-level access control

### Data Security

1. **Encryption at Rest**:
   - MongoDB: Encryption enabled
   - S3: SSE-S3 encryption
   - EBS volumes: Encrypted
   - Secrets Manager: Encrypted by default

2. **Encryption in Transit**:
   - TLS 1.3 for all API communications
   - HTTPS only (HTTP redirects to HTTPS)
   - Certificate pinning in mobile apps

3. **Data Privacy**:
   - PII data minimization
   - User consent for data collection
   - Data anonymization for analytics
   - Right to deletion (GDPR compliance)
   - Data retention policy (2 years)

### Network Security

1. **VPC Configuration**:
   - Private subnets for backend services
   - Public subnets for load balancers
   - NAT Gateway for outbound traffic
   - Security groups with least privilege

2. **API Security**:
   - Rate limiting (100 req/min per user)
   - Input validation and sanitization
   - SQL injection prevention (parameterized queries)
   - XSS prevention (output encoding)
   - CORS configuration

3. **DDoS Protection**:
   - AWS Shield Standard (automatic)
   - CloudFront for traffic distribution
   - Rate limiting at API Gateway

### Compliance

1. **Data Protection**:
   - Compliance with Indian IT Act
   - GDPR compliance for international users
   - Regular security audits
   - Penetration testing

2. **Audit Logging**:
   - CloudTrail for AWS API calls
   - Application logs in CloudWatch
   - Database audit logs
   - Retention: 1 year

### Vulnerability Management

1. **Dependency Scanning**:
   - Automated scanning with Snyk or Dependabot
   - Regular updates of dependencies
   - Security patches within 48 hours

2. **Code Security**:
   - Static code analysis (SonarQube)
   - Secret scanning (prevent credential leaks)
   - Code review process

---

## Deployment Strategy

### Environment Setup

1. **Environments**:
   - **Development**: For active development
   - **Staging**: Pre-production testing
   - **Production**: Live system

2. **Infrastructure as Code**:
   - Terraform for AWS resource provisioning
   - Version controlled in Git
   - Separate state files per environment

### CI/CD Pipeline

**Tools**: GitHub Actions / AWS CodePipeline

**Pipeline Stages**:

1. **Build**:
   - Checkout code
   - Install dependencies
   - Run linters (flake8, eslint)
   - Run unit tests
   - Build Docker images
   - Push to Amazon ECR

2. **Test**:
   - Deploy to staging environment
   - Run integration tests
   - Run API tests (Postman/Newman)
   - Performance testing
   - Security scanning

3. **Deploy**:
   - Manual approval for production
   - Blue-green deployment
   - Update ECS task definitions
   - Deploy new tasks
   - Health checks
   - Route traffic to new version
   - Monitor for errors

4. **Rollback**:
   - Automatic rollback if error rate > 5%
   - Manual rollback option
   - Revert to previous task definition

### Deployment Process

**Backend Deployment**:
```bash
# Build and push Docker image
docker build -t krishimitra-api:v1.2.0 .
docker tag krishimitra-api:v1.2.0 <ecr-repo>/krishimitra-api:v1.2.0
docker push <ecr-repo>/krishimitra-api:v1.2.0

# Update ECS task definition
aws ecs register-task-definition --cli-input-json file://task-def.json

# Update service (blue-green)
aws ecs update-service --cluster krishimitra --service api-service \
  --task-definition krishimitra-api:v1.2.0 --force-new-deployment
```

**ML Model Deployment**:
```python
# Register model in SageMaker
model = Model(
    model_data=f"s3://krishimitra-models/crop-recommender/v2.0/model.tar.gz",
    role=sagemaker_role,
    framework_version="1.0",
    py_version="py3"
)

# Deploy to endpoint
predictor = model.deploy(
    initial_instance_count=1,
    instance_type="ml.t3.medium",
    endpoint_name="crop-recommender-v2"
)
```

### Database Migration

**Tool**: Alembic (for schema changes)

**Process**:
1. Create migration script
2. Test in development
3. Apply to staging
4. Validate data integrity
5. Apply to production during low-traffic window
6. Monitor for errors

---

## Monitoring & Logging

### Application Monitoring

**Metrics**:
- Request rate (requests/second)
- Response time (p50, p95, p99)
- Error rate (4xx, 5xx)
- Active users
- API endpoint usage

**Tools**:
- CloudWatch for AWS metrics
- Custom metrics via CloudWatch API
- Real-time dashboards

### ML Model Monitoring

**Metrics**:
- Inference latency
- Prediction distribution
- Model accuracy (vs. actual outcomes)
- Data drift detection
- Feature importance changes

**Alerts**:
- Accuracy drop > 10%
- Inference latency > 5 seconds
- Prediction distribution shift

### Infrastructure Monitoring

**Metrics**:
- CPU utilization
- Memory usage
- Disk I/O
- Network throughput
- Database connections

**Alerts**:
- CPU > 80% for 5 minutes
- Memory > 85%
- Disk usage > 80%
- Database connection pool > 90%

### Logging Strategy

**Log Levels**:
- ERROR: Application errors, exceptions
- WARN: Degraded performance, retries
- INFO: Important events (user actions, API calls)
- DEBUG: Detailed debugging information

**Log Aggregation**:
- All logs sent to CloudWatch Logs
- Log groups per service
- Retention: 30 days (production), 7 days (dev)

**Log Analysis**:
- CloudWatch Insights for querying
- Alerts on error patterns
- Export to S3 for long-term storage

### Alerting

**Alert Channels**:
- Email for non-urgent alerts
- SMS for critical alerts
- Slack integration for team notifications
- PagerDuty for on-call rotation

**Alert Rules**:
- Critical: API down, database unreachable
- High: Error rate > 5%, latency > 10s
- Medium: Disk usage > 80%, cache miss rate > 50%
- Low: Model accuracy drop, data staleness

---

## Future Extensibility

### Phase 2 Enhancements

1. **IoT Integration**:
   - Soil moisture sensors
   - Weather stations
   - Automated irrigation systems
   - Real-time data ingestion via AWS IoT Core

2. **Computer Vision**:
   - Crop disease detection from images
   - Pest identification
   - Yield estimation from drone imagery
   - Integration with Amazon Rekognition

3. **Marketplace**:
   - Direct farmer-to-buyer platform
   - Price negotiation features
   - Order management
   - Payment integration

4. **Financial Services**:
   - Crop insurance recommendations
   - Micro-loan eligibility assessment
   - Subsidy application assistance

5. **Community Features**:
   - Farmer forums and discussion boards
   - Knowledge sharing platform
   - Success story showcases
   - Peer-to-peer advisory

### Scalability Roadmap

**Year 1**: 100,000 users, 5 states
**Year 2**: 1 million users, 15 states
**Year 3**: 10 million users, pan-India

**Technical Evolution**:
- Migrate to microservices architecture
- Implement event sourcing for audit trails
- Add GraphQL API for flexible queries
- Multi-region deployment for low latency
- Edge computing for offline capabilities

### Technology Upgrades

1. **ML Enhancements**:
   - Deep learning models (transformers)
   - Federated learning for privacy
   - Reinforcement learning for optimization
   - AutoML for continuous improvement

2. **AI Capabilities**:
   - Voice-based advisory (Alexa, Google Assistant)
   - Video content generation
   - Personalized learning paths
   - Predictive maintenance for equipment

3. **Data Platform**:
   - Real-time data streaming (Kinesis)
   - Data lake for analytics (Athena, Redshift)
   - Business intelligence dashboards (QuickSight)
   - Data marketplace for researchers

---

## Conclusion

This design document provides a comprehensive technical blueprint for KrishiMitra-AI, a scalable, secure, and intelligent platform for rural agricultural decision-making. The architecture leverages AWS cloud services, machine learning, and generative AI to deliver personalized, multilingual advisory services to Indian farmers.

Key design principles include:
- **Scalability**: Horizontal scaling to support millions of users
- **Performance**: Sub-3-second response times with caching and optimization
- **Security**: End-to-end encryption, RBAC, and compliance with data protection regulations
- **Reliability**: 99.5% uptime with auto-scaling and disaster recovery
- **Cost Efficiency**: Serverless architecture and optimized resource usage
- **Extensibility**: Modular design for future enhancements

The platform is designed for rapid prototyping during the hackathon phase while maintaining production-ready architecture for long-term deployment and scaling.
