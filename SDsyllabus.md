Lessons to Cover : 
01
Foundations
13 TOPICS
02
APIs, Services & Protocols
13 TOPICS
03
Data Modeling & SQL
13 TOPICS
04
NoSQL, Partitioning & IDs
14 TOPICS
05
Caching & Fast Reads
7 TOPICS
06
Distributed Coordination
13 TOPICS
07
Storage Engines
20 TOPICS
08
Async Work & Streams
10 TOPICS
09
Search & Retrieval
17 TOPICS
10
Analytics & Sketches
13 TOPICS
11
Realtime, Social & Feeds
12 TOPICS
12
Geo, Matching & Recs
8 TOPICS
13
Media, Files & CDN
11 TOPICS
14
Reliability & Operations
15 TOPICS

---

01
Foundations

Scalability basics, system design process, tradeoffs, and capacity planning.

13 TOPICS
01.01
Requirements Clarification
01.02
Logical System Design
01.03
Non-Functional Requirements
01.04
System Design Tradeoffs
01.05
Availability Durability Consistency And Cost
01.06
Back-Of-The-Envelope Capacity Planning
01.07
Concurrency Vs Parallelism
01.08
Horizontal Vs Vertical Scaling
01.09
Monolith Vs Microservices
01.10
Repository Pattern
01.11
Extensible Data Modeling
01.12
Cost-Aware Architecture
01.13
When Not To Add Infrastructure
02
APIs, Services & Protocols

API design, load balancing, gRPC vs REST, retries, and backpressure.

13 TOPICS
02.01
API Design Contracts
02.02
Service-To-Service Communication
02.03
HTTP REST And gRPC
02.04
TCP Vs UDP
02.05
API Gateway vs Load Balancer
02.06
Load Balancers
02.07
Consistent Hashing Load Balancing
02.08
Event Contracts
02.09
Retries Timeouts And Idempotency
02.10
Batching
02.11
Backpressure
02.12
Tail Latency
02.13
Load Shedding
03
Data Modeling & SQL

Relational database design, indexing, ACID, locking, WAL, and schema evolution.

13 TOPICS
03.01
Relational Database Design
03.02
SQL-Backed Key-Value Store
03.03
Database Indexing
03.04
B-Tree
03.05
Query Planning
03.06
Database Locking And Isolation
03.07
MVCC
03.08
Database WAL And Recovery
03.09
Database Ticket Servers
03.10
Relational Database Scaling
03.11
Online Indexing
03.12
Schema Evolution
03.13
Soft Delete
04
NoSQL, Partitioning & IDs

NoSQL databases, sharding, consistent hashing, Bloom filters, and ID generation.

14 TOPICS
04.01
NoSQL Decision Boundaries
04.02
Document Stores vs Key-Value Stores
04.03
Columnar Stores vs Wide-Column Stores
04.04
Graph Database Decision Boundary
04.05
Sharding And Partitioning
04.06
Hot Partitions
04.07
Consistent Hashing
04.08
Distributed ID Generation
04.09
UUID vs ObjectId vs Snowflake
04.10
Snowflake ID Design
04.11
Clock Skew And ID Ordering
04.12
Keyset Pagination
04.13
Bloom Filters
04.14
Hot And Cold Storage Archival
05
Caching & Fast Reads

Caching strategies, eviction policies, Redis, CDN, and cache invalidation.

7 TOPICS
05.01
Caching Layers
05.02
Distributed Cache Design
05.03
Cache Eviction Policies
05.04
TTL Expiration And Cache Reapers
05.05
Cache Concurrency Control
05.06
Cache Availability And Database Fallback
05.07
MySQL MEMORY Engine Cache
06
Distributed Coordination

Distributed systems foundations, consensus, leader election, gossip protocols.

13 TOPICS
06.01
Distributed Systems Foundations
06.02
Consistency Models
06.03
Replication
06.04
CAP And PACELC
06.05
Clocks And Ordering
06.06
Consensus
06.07
Leader Election
06.08
Distributed Locks And Leases
06.09
Redis Redlock And Fencing Tokens
06.10
Circuit Breakers And Timeouts
06.11
Gossip Protocol
06.12
Metadata Service And Node Discovery
06.13
Distributed Hash Tables
07
Storage Engines

LSM trees, B-trees, SSTables, compaction, object storage, and write-ahead logs.

20 TOPICS
07.01
Storage Engine Design Constraints
07.02
Storage Engine Tradeoffs
07.03
File-Backed Dictionary Storage Engine
07.04
Custom Binary File Format
07.05
Byte-Range Indexed Object Storage
07.06
Immutable Versioned Data Files
07.07
Log-Structured Storage
07.08
Bitcask Storage Engine
07.09
LSM Tree Storage Engine
07.10
Memtable WAL And SSTable
07.11
LSM Read Path Bloom And Sparse Index
07.12
Compaction And Amplification
07.13
Object Storage Vs Database
07.14
S3-Style Object Storage Architecture
07.15
Range Partitioning vs Consistent Hashing for Storage
07.16
Partition Manager And Map Table
07.17
Metadata DB For Object Storage
07.18
Append-Only Object Storage Stream Layer
07.19
Object Storage Durability And Replication
07.20
End-To-End Checksums
08
Async Work & Streams

Message queues, Kafka, event-driven architecture, task scheduling.

10 TOPICS
08.01
Delegation And Async Work
08.02
Task Queue Vs Event Stream
08.03
Event Bus For Product Events
08.04
Queue Lag
08.05
Distributed Task Scheduler
08.06
Postgres SKIP LOCKED Work Queue
08.07
DAG Workflow Orchestration
08.08
Rule Engine Trigger Framework
08.09
Fanout Patterns
08.10
Flash Sale Inventory Locking
09
Search & Retrieval

Inverted indexes, ranking algorithms, full-text search, autocomplete.

17 TOPICS
09.01
Information Retrieval System Design
09.02
Inverted Index And Posting Lists
09.03
Boolean Tiered Search
09.04
TF-IDF Relevance Scoring
09.05
BM25 Production Ranking
09.06
Stop Words And Champion Lists
09.07
Query Understanding Pipeline
09.08
Search Feedback And Relevance Signals
09.09
Search Evaluation Metrics
09.10
Search Index Synchronization
09.11
Search Index Sharding
09.12
Crawler And Indexing Pipeline
09.13
Vector Search And Hybrid Retrieval
09.14
Autocomplete System Design
09.15
Did You Mean And Spell Correction
09.16
Related Searches
09.17
Recent Searches System Design
10
Analytics & Sketches

Counting at scale, HyperLogLog, streaming analytics, probabilistic data structures.

13 TOPICS
10.01
Counting At Scale
10.02
View Counting At Scale
10.03
Impression Counting System Design
10.04
HyperLogLog Cardinality Estimation
10.05
Mergeable Sketches For Analytics
10.06
Bucketed Time Window Aggregation
10.07
Raw Events Vs Derived Analytics
10.08
Count-Min Sketch
10.09
Top-K Heavy Hitters
10.10
Reservoir Sampling
10.11
TDigest Quantile Sketch
10.12
Streaming Percentile Analytics
10.13
Live Reactions High Throughput Design
11
Realtime, Social & Feeds

WebSockets, news feeds, social graph modeling, push vs pull fanout.

12 TOPICS
11.01
Real-Time Database And WebSocket Scaling
11.02
Short Poll Vs Long Poll Vs WebSocket
11.03
Long Polling Vs WebSockets
11.04
WebSockets Vs SSE Vs Long Polling
11.05
Social Network Database Modeling
11.06
Social Graph Follows And FlockDB
11.07
Feed Generation Push Pull Hybrid
11.08
Newly-Unread Indicator
11.09
Hashtag Extraction And Tag Store
11.10
Reaction Modeling
11.11
Photo Tagging Coordinate Model
11.12
Live Commentary System Design
12
Geo, Matching & Recs

Geospatial indexing, geohash, proximity search, matching algorithms.

8 TOPICS
12.01
Nearby Geospatial Search System Design
12.02
Geohash Prefix Spatial Index
12.03
Geospatial Grid Systems H3 S2 Geohash
12.04
Redis GEO Spatial Hot Path
12.05
Geofencing Point In Polygon
12.06
Ray Casting Point In Polygon
12.07
Seen Filtering Bloom Vs Exact Sets
12.08
Matching And Recommendation Algorithms
13
Media, Files & CDN

CDN architecture, video transcoding, file uploads, signed URLs, live streaming.

11 TOPICS
13.01
Direct To Object Storage Upload
13.02
Image CDN And Resizing
13.03
Gravatar-Style Avatar Service
13.04
Video Upload With Signed URLs And Multipart
13.05
Video Transcoding Pipeline
13.06
Adaptive Bitrate And CDN Decider
13.07
Signed URLs DRM And Video Security
13.08
Live Streaming WebRTC And Latency
13.09
Remote File Sync Design
13.10
Fixed Block Chunking And Content Addressing
13.11
Blocklist Versioned File Metadata
14
Reliability & Operations

Observability, SLOs, deployment strategies, rate limiting, and incident response.

15 TOPICS
14.01
Observability For Distributed Systems
14.02
SLOs And Error Budgets
14.03
Incident Response
14.04
Deployment And Migration Safety
14.05
Database Migration Safety
14.06
Parallel Monolith Read Drain
14.07
Database Backups And Restore
14.08
Backup And Restore Strategy
14.09
Disaster Recovery
14.10
Data Retention And Deletion
14.11
Privacy And Data Retention
14.12
Security And Abuse Prevention
14.13
Rate Limiter Placement And Keys
14.14
Sliding Window Rate Limiter
14.15
Multi-Tenant Design

---

01
Foundations

Scalability basics, system design process, tradeoffs, and capacity planning.

13 TOPICS
01.01
Requirements Clarification
01.02
Logical System Design
01.03
Non-Functional Requirements
01.04
System Design Tradeoffs
01.05
Availability Durability Consistency And Cost
01.06
Back-Of-The-Envelope Capacity Planning
01.07
Concurrency Vs Parallelism
01.08
Horizontal Vs Vertical Scaling
01.09
Monolith Vs Microservices
01.10
Repository Pattern
01.11
Extensible Data Modeling
01.12
Cost-Aware Architecture
01.13
When Not To Add Infrastructure

---

13 TOPICS

---

02
APIs, Services & Protocols

API design, load balancing, gRPC vs REST, retries, and backpressure.

13 TOPICS
02.01
API Design Contracts
02.02
Service-To-Service Communication
02.03
HTTP REST And gRPC
02.04
TCP Vs UDP
02.05
API Gateway vs Load Balancer
02.06
Load Balancers
02.07
Consistent Hashing Load Balancing
02.08
Event Contracts
02.09
Retries Timeouts And Idempotency
02.10
Batching
02.11
Backpressure
02.12
Tail Latency
02.13
Load Shedding

---

03
Data Modeling & SQL

Relational database design, indexing, ACID, locking, WAL, and schema evolution.

13 TOPICS
03.01
Relational Database Design
03.02
SQL-Backed Key-Value Store
03.03
Database Indexing
03.04
B-Tree
03.05
Query Planning
03.06
Database Locking And Isolation
03.07
MVCC
03.08
Database WAL And Recovery
03.09
Database Ticket Servers
03.10
Relational Database Scaling
03.11
Online Indexing
03.12
Schema Evolution
03.13
Soft Delete

---

04
NoSQL, Partitioning & IDs

NoSQL databases, sharding, consistent hashing, Bloom filters, and ID generation.

14 TOPICS
04.01
NoSQL Decision Boundaries
04.02
Document Stores vs Key-Value Stores
04.03
Columnar Stores vs Wide-Column Stores
04.04
Graph Database Decision Boundary
04.05
Sharding And Partitioning
04.06
Hot Partitions
04.07
Consistent Hashing
04.08
Distributed ID Generation
04.09
UUID vs ObjectId vs Snowflake
04.10
Snowflake ID Design
04.11
Clock Skew And ID Ordering
04.12
Keyset Pagination
04.13
Bloom Filters
04.14
Hot And Cold Storage Archival

---

14 TOPICS

---

05
Caching & Fast Reads

Caching strategies, eviction policies, Redis, CDN, and cache invalidation.

7 TOPICS
05.01
Caching Layers
05.02
Distributed Cache Design
05.03
Cache Eviction Policies
05.04
TTL Expiration And Cache Reapers
05.05
Cache Concurrency Control
05.06
Cache Availability And Database Fallback
05.07
MySQL MEMORY Engine Cache

---

06
Distributed Coordination

Distributed systems foundations, consensus, leader election, gossip protocols.

13 TOPICS
06.01
Distributed Systems Foundations
06.02
Consistency Models
06.03
Replication
06.04
CAP And PACELC
06.05
Clocks And Ordering
06.06
Consensus
06.07
Leader Election
06.08
Distributed Locks And Leases
06.09
Redis Redlock And Fencing Tokens
06.10
Circuit Breakers And Timeouts
06.11
Gossip Protocol
06.12
Metadata Service And Node Discovery
06.13
Distributed Hash Tables

---

07
Storage Engines

LSM trees, B-trees, SSTables, compaction, object storage, and write-ahead logs.

20 TOPICS
07.01
Storage Engine Design Constraints
07.02
Storage Engine Tradeoffs
07.03
File-Backed Dictionary Storage Engine
07.04
Custom Binary File Format
07.05
Byte-Range Indexed Object Storage
07.06
Immutable Versioned Data Files
07.07
Log-Structured Storage
07.08
Bitcask Storage Engine
07.09
LSM Tree Storage Engine
07.10
Memtable WAL And SSTable
07.11
LSM Read Path Bloom And Sparse Index
07.12
Compaction And Amplification
07.13
Object Storage Vs Database
07.14
S3-Style Object Storage Architecture
07.15
Range Partitioning vs Consistent Hashing for Storage
07.16
Partition Manager And Map Table
07.17
Metadata DB For Object Storage
07.18
Append-Only Object Storage Stream Layer
07.19
Object Storage Durability And Replication
07.20
End-To-End Checksums

---

20 TOPICS

---

08
Async Work & Streams

Message queues, Kafka, event-driven architecture, task scheduling.

10 TOPICS
08.01
Delegation And Async Work
08.02
Task Queue Vs Event Stream
08.03
Event Bus For Product Events
08.04
Queue Lag
08.05
Distributed Task Scheduler
08.06
Postgres SKIP LOCKED Work Queue
08.07
DAG Workflow Orchestration
08.08
Rule Engine Trigger Framework
08.09
Fanout Patterns
08.10
Flash Sale Inventory Locking

---

10 TOPICS

---

09
Search & Retrieval

Inverted indexes, ranking algorithms, full-text search, autocomplete.

17 TOPICS
09.01
Information Retrieval System Design
09.02
Inverted Index And Posting Lists
09.03
Boolean Tiered Search
09.04
TF-IDF Relevance Scoring
09.05
BM25 Production Ranking
09.06
Stop Words And Champion Lists
09.07
Query Understanding Pipeline
09.08
Search Feedback And Relevance Signals
09.09
Search Evaluation Metrics
09.10
Search Index Synchronization
09.11
Search Index Sharding
09.12
Crawler And Indexing Pipeline
09.13
Vector Search And Hybrid Retrieval
09.14
Autocomplete System Design
09.15
Did You Mean And Spell Correction
09.16
Related Searches
09.17
Recent Searches System Design

---

17 TOPICS

---

10
Analytics & Sketches

Counting at scale, HyperLogLog, streaming analytics, probabilistic data structures.

13 TOPICS
10.01
Counting At Scale
10.02
View Counting At Scale
10.03
Impression Counting System Design
10.04
HyperLogLog Cardinality Estimation
10.05
Mergeable Sketches For Analytics
10.06
Bucketed Time Window Aggregation
10.07
Raw Events Vs Derived Analytics
10.08
Count-Min Sketch
10.09
Top-K Heavy Hitters
10.10
Reservoir Sampling
10.11
TDigest Quantile Sketch
10.12
Streaming Percentile Analytics
10.13
Live Reactions High Throughput Design

---

11
Realtime, Social & Feeds

WebSockets, news feeds, social graph modeling, push vs pull fanout.

12 TOPICS
11.01
Real-Time Database And WebSocket Scaling
11.02
Short Poll Vs Long Poll Vs WebSocket
11.03
Long Polling Vs WebSockets
11.04
WebSockets Vs SSE Vs Long Polling
11.05
Social Network Database Modeling
11.06
Social Graph Follows And FlockDB
11.07
Feed Generation Push Pull Hybrid
11.08
Newly-Unread Indicator
11.09
Hashtag Extraction And Tag Store
11.10
Reaction Modeling
11.11
Photo Tagging Coordinate Model
11.12
Live Commentary System Design

---

12 TOPICS

---

12
Geo, Matching & Recs

Geospatial indexing, geohash, proximity search, matching algorithms.

8 TOPICS
12.01
Nearby Geospatial Search System Design
12.02
Geohash Prefix Spatial Index
12.03
Geospatial Grid Systems H3 S2 Geohash
12.04
Redis GEO Spatial Hot Path
12.05
Geofencing Point In Polygon
12.06
Ray Casting Point In Polygon
12.07
Seen Filtering Bloom Vs Exact Sets
12.08
Matching And Recommendation Algorithms

---

13
Media, Files & CDN

CDN architecture, video transcoding, file uploads, signed URLs, live streaming.

11 TOPICS
13.01
Direct To Object Storage Upload
13.02
Image CDN And Resizing
13.03
Gravatar-Style Avatar Service
13.04
Video Upload With Signed URLs And Multipart
13.05
Video Transcoding Pipeline
13.06
Adaptive Bitrate And CDN Decider
13.07
Signed URLs DRM And Video Security
13.08
Live Streaming WebRTC And Latency
13.09
Remote File Sync Design
13.10
Fixed Block Chunking And Content Addressing
13.11
Blocklist Versioned File Metadata

---

11 TOPICS

---

14
Reliability & Operations

Observability, SLOs, deployment strategies, rate limiting, and incident response.

15 TOPICS
14.01
Observability For Distributed Systems
14.02
SLOs And Error Budgets
14.03
Incident Response
14.04
Deployment And Migration Safety
14.05
Database Migration Safety
14.06
Parallel Monolith Read Drain
14.07
Database Backups And Restore
14.08
Backup And Restore Strategy
14.09
Disaster Recovery
14.10
Data Retention And Deletion
14.11
Privacy And Data Retention
14.12
Security And Abuse Prevention
14.13
Rate Limiter Placement And Keys
14.14
Sliding Window Rate Limiter
14.15
Multi-Tenant Design

---

15 TOPICS