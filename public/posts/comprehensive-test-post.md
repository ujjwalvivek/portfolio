---
title: "All The Features"
date: "2025-06-28"
slug: "comprehensive-test-post"
tags: ["markdown", "testing", "features", "demo"]
description: "A showcase of all advanced markdown features available on this blog."
---

# Comprehensive Markdown Feature Test

This post demonstrates every advanced markdown feature available on this blog. It's designed to be a long, scrollable document to test the progress bar functionality and showcase all rendering capabilities.

## Basic Formatting {#basic-formatting}

### Text Styling

**Bold text** and *italic text* and ***bold italic text***

~~Strikethrough text~~ and `inline code`

### Lists

#### Unordered Lists

- First item
- Second item
  - Nested item
  - Another nested item
    - Deep nested item
- Third item

#### Ordered Lists

1. First numbered item
2. Second numbered item
   1. Nested numbered item
   2. Another nested numbered item
3. Third numbered item

#### Task Lists

- [x] Completed task
- [ ] Incomplete task
- [x] Another completed task
- [ ] Yet another incomplete task

### Blockquotes

> This is a blockquote. It can contain multiple paragraphs and other markdown elements.
> 
> This is the second paragraph in the blockquote.
> 
> > This is a nested blockquote.
> 
> Back to the first level.

> **Note**: This is a styled blockquote with bold text.

### Horizontal Rules

---

## Code Blocks and Syntax Highlighting {#code-blocks}

### JavaScript

```javascript
// Advanced React component with hooks
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';

const AdvancedComponent = ({ data, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [loading, setLoading] = useState(false);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((term) => {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        console.log(`Searching for: ${term}`);
        setLoading(false);
      }, 500);
    }, 300),
    []
  );

  // Memoized filtered and sorted data
  const processedData = useMemo(() => {
    if (!data) return [];
    
    let filtered = data.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return filtered.sort((a, b) => {
      if (sortOrder === 'asc') {
        return a.name.localeCompare(b.name);
      }
      return b.name.localeCompare(a.name);
    });
  }, [data, searchTerm, sortOrder]);

  useEffect(() => {
    if (searchTerm) {
      debouncedSearch(searchTerm);
    }
  }, [searchTerm, debouncedSearch]);

  const handleSortToggle = useCallback(() => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  }, []);

  return (
    <div className="advanced-component">
      <div className="controls">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <button onClick={handleSortToggle} className="sort-button">
          Sort {sortOrder === 'asc' ? '↑' : '↓'}
        </button>
      </div>
      
      {loading && <div className="loading">Searching...</div>}
      
      <div className="results">
        {processedData.map(item => (
          <div key={item.id} className="result-item">
            <h3>{item.name}</h3>
            <p>{item.description}</p>
            <button onClick={() => onUpdate(item.id)}>
              Update
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdvancedComponent;
```

### TypeScript

```typescript
// Advanced TypeScript interfaces and generics
interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

interface User extends BaseEntity {
  email: string;
  username: string;
  profile: UserProfile;
  roles: Role[];
}

interface UserProfile {
  firstName: string;
  lastName: string;
  avatar?: string;
  bio?: string;
  socialLinks: SocialLink[];
}

interface SocialLink {
  platform: 'twitter' | 'github' | 'linkedin' | 'website';
  url: string;
}

interface Role {
  name: string;
  permissions: Permission[];
}

interface Permission {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete')[];
}

// Generic repository pattern
abstract class BaseRepository<T extends BaseEntity> {
  protected abstract tableName: string;

  async findById(id: string): Promise<T | null> {
    // Implementation would go here
    return null;
  }

  async create(data: Omit<T, keyof BaseEntity>): Promise<T> {
    // Implementation would go here
    throw new Error('Not implemented');
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    // Implementation would go here
    return null;
  }

  async delete(id: string): Promise<boolean> {
    // Implementation would go here
    return false;
  }

  async findMany(filters?: Partial<T>): Promise<T[]> {
    // Implementation would go here
    return [];
  }
}

// User repository implementation
class UserRepository extends BaseRepository<User> {
  protected tableName = 'users';

  async findByEmail(email: string): Promise<User | null> {
    // Implementation specific to users
    return null;
  }

  async findByUsername(username: string): Promise<User | null> {
    // Implementation specific to users
    return null;
  }

  async updateProfile(userId: string, profile: Partial<UserProfile>): Promise<User | null> {
    // Implementation specific to user profiles
    return null;
  }
}

// Service layer with dependency injection
class UserService {
  constructor(
    private userRepository: UserRepository,
    private emailService: EmailService,
    private logger: Logger
  ) {}

  async createUser(userData: CreateUserInput): Promise<User> {
    try {
      // Validate email uniqueness
      const existingUser = await this.userRepository.findByEmail(userData.email);
      if (existingUser) {
        throw new ConflictError('Email already exists');
      }

      // Create user
      const user = await this.userRepository.create({
        ...userData,
        profile: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          socialLinks: []
        },
        roles: [{ name: 'user', permissions: [] }]
      });

      // Send welcome email
      await this.emailService.sendWelcome(user.email, user.profile.firstName);

      this.logger.info(`User created: ${user.id}`);
      return user;
    } catch (error) {
      this.logger.error('Failed to create user:', error);
      throw error;
    }
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const user = await this.userRepository.findById(userId);
    return user?.profile || null;
  }
}

// Error handling with custom types
class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

class ValidationError extends AppError {
  constructor(message: string, public field?: string) {
    super(400, message);
  }
}

class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message);
  }
}

// Type guards and utility types
type CreateUserInput = Pick<User, 'email' | 'username'> & {
  firstName: string;
  lastName: string;
  password: string;
};

function isUser(obj: any): obj is User {
  return obj && typeof obj.id === 'string' && typeof obj.email === 'string';
}

// Advanced utility types
type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
```

### Python

```python
# Advanced Python with async/await and type hints
import asyncio
import aiohttp
from typing import List, Dict, Optional, Union, Generic, TypeVar, Protocol
from dataclasses import dataclass, field
from abc import ABC, abstractmethod
import logging
from datetime import datetime, timedelta

# Type variables and protocols
T = TypeVar('T')
K = TypeVar('K')
V = TypeVar('V')

class Serializable(Protocol):
    def to_dict(self) -> Dict[str, any]: ...

@dataclass
class APIResponse(Generic[T]):
    data: T
    status: int
    message: str = ""
    errors: List[str] = field(default_factory=list)
    timestamp: datetime = field(default_factory=datetime.utcnow)

    def is_success(self) -> bool:
        return 200 <= self.status < 300

@dataclass
class User:
    id: str
    username: str
    email: str
    created_at: datetime
    is_active: bool = True
    metadata: Dict[str, any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, any]:
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat(),
            'is_active': self.is_active,
            'metadata': self.metadata
        }

# Abstract base classes
class BaseRepository(ABC, Generic[T]):
    @abstractmethod
    async def get_by_id(self, id: str) -> Optional[T]:
        pass

    @abstractmethod
    async def create(self, entity: T) -> T:
        pass

    @abstractmethod
    async def update(self, id: str, data: Dict[str, any]) -> Optional[T]:
        pass

    @abstractmethod
    async def delete(self, id: str) -> bool:
        pass

    @abstractmethod
    async def list(self, limit: int = 10, offset: int = 0) -> List[T]:
        pass

class APIClient:
    def __init__(self, base_url: str, timeout: int = 30):
        self.base_url = base_url.rstrip('/')
        self.timeout = aiohttp.ClientTimeout(total=timeout)
        self.session: Optional[aiohttp.ClientSession] = None
        self.logger = logging.getLogger(__name__)

    async def __aenter__(self):
        self.session = aiohttp.ClientSession(timeout=self.timeout)
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    async def _request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict] = None,
        params: Optional[Dict] = None,
        headers: Optional[Dict] = None
    ) -> APIResponse[Dict]:
        if not self.session:
            raise RuntimeError("APIClient must be used as async context manager")

        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        
        try:
            async with self.session.request(
                method, url, json=data, params=params, headers=headers
            ) as response:
                response_data = await response.json()
                
                return APIResponse(
                    data=response_data,
                    status=response.status,
                    message=response_data.get('message', ''),
                    errors=response_data.get('errors', [])
                )
        except asyncio.TimeoutError:
            self.logger.error(f"Request timeout for {method} {url}")
            raise
        except aiohttp.ClientError as e:
            self.logger.error(f"Request failed for {method} {url}: {e}")
            raise

    async def get(self, endpoint: str, params: Optional[Dict] = None) -> APIResponse[Dict]:
        return await self._request('GET', endpoint, params=params)

    async def post(self, endpoint: str, data: Optional[Dict] = None) -> APIResponse[Dict]:
        return await self._request('POST', endpoint, data=data)

    async def put(self, endpoint: str, data: Optional[Dict] = None) -> APIResponse[Dict]:
        return await self._request('PUT', endpoint, data=data)

    async def delete(self, endpoint: str) -> APIResponse[Dict]:
        return await self._request('DELETE', endpoint)

class UserRepository(BaseRepository[User]):
    def __init__(self, api_client: APIClient):
        self.api_client = api_client

    async def get_by_id(self, id: str) -> Optional[User]:
        response = await self.api_client.get(f"/users/{id}")
        if response.is_success():
            return User(**response.data)
        return None

    async def create(self, user: User) -> User:
        response = await self.api_client.post("/users", user.to_dict())
        if response.is_success():
            return User(**response.data)
        raise ValueError(f"Failed to create user: {response.errors}")

    async def update(self, id: str, data: Dict[str, any]) -> Optional[User]:
        response = await self.api_client.put(f"/users/{id}", data)
        if response.is_success():
            return User(**response.data)
        return None

    async def delete(self, id: str) -> bool:
        response = await self.api_client.delete(f"/users/{id}")
        return response.is_success()

    async def list(self, limit: int = 10, offset: int = 0) -> List[User]:
        response = await self.api_client.get(
            "/users", 
            params={"limit": limit, "offset": offset}
        )
        if response.is_success():
            return [User(**user_data) for user_data in response.data.get('users', [])]
        return []

class UserService:
    def __init__(self, user_repository: UserRepository):
        self.user_repository = user_repository
        self.logger = logging.getLogger(__name__)

    async def get_user_profile(self, user_id: str) -> Optional[User]:
        try:
            return await self.user_repository.get_by_id(user_id)
        except Exception as e:
            self.logger.error(f"Failed to get user profile {user_id}: {e}")
            return None

    async def create_user(self, user_data: Dict[str, any]) -> User:
        user = User(
            id=user_data['id'],
            username=user_data['username'],
            email=user_data['email'],
            created_at=datetime.utcnow()
        )
        
        try:
            return await self.user_repository.create(user)
        except Exception as e:
            self.logger.error(f"Failed to create user: {e}")
            raise

    async def bulk_update_users(self, updates: List[Dict[str, any]]) -> List[Optional[User]]:
        tasks = [
            self.user_repository.update(update['id'], update['data'])
            for update in updates
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        processed_results = []
        for result in results:
            if isinstance(result, Exception):
                self.logger.error(f"Bulk update failed: {result}")
                processed_results.append(None)
            else:
                processed_results.append(result)
        
        return processed_results

# Example usage
async def main():
    async with APIClient("https://api.example.com") as client:
        user_repo = UserRepository(client)
        user_service = UserService(user_repo)
        
        # Get user profile
        user = await user_service.get_user_profile("user123")
        if user:
            print(f"Found user: {user.username}")
        
        # Create new user
        new_user_data = {
            'id': 'user456',
            'username': 'johndoe',
            'email': 'john@example.com'
        }
        
        new_user = await user_service.create_user(new_user_data)
        print(f"Created user: {new_user.id}")

# Run the async main function
if __name__ == "__main__":
    asyncio.run(main())
```

### SQL

```sql
-- Advanced SQL queries with CTEs, window functions, and complex joins

-- Common Table Expression (CTE) for recursive data
WITH RECURSIVE category_hierarchy AS (
    -- Base case: top-level categories
    SELECT 
        id,
        name,
        parent_id,
        0 as level,
        name as path
    FROM categories 
    WHERE parent_id IS NULL
    
    UNION ALL
    
    -- Recursive case: child categories
    SELECT 
        c.id,
        c.name,
        c.parent_id,
        ch.level + 1,
        ch.path || ' > ' || c.name
    FROM categories c
    INNER JOIN category_hierarchy ch ON c.parent_id = ch.id
),

-- Advanced aggregations with window functions
user_stats AS (
    SELECT 
        u.id,
        u.username,
        u.created_at,
        COUNT(p.id) as total_posts,
        COUNT(c.id) as total_comments,
        AVG(p.view_count) as avg_post_views,
        ROW_NUMBER() OVER (ORDER BY COUNT(p.id) DESC) as post_rank,
        PERCENT_RANK() OVER (ORDER BY COUNT(p.id)) as post_percentile,
        LAG(COUNT(p.id)) OVER (ORDER BY u.created_at) as prev_user_posts,
        LEAD(COUNT(p.id)) OVER (ORDER BY u.created_at) as next_user_posts
    FROM users u
    LEFT JOIN posts p ON u.id = p.author_id AND p.status = 'published'
    LEFT JOIN comments c ON u.id = c.author_id
    WHERE u.is_active = true
    GROUP BY u.id, u.username, u.created_at
),

-- Complex filtering and ranking
trending_posts AS (
    SELECT 
        p.id,
        p.title,
        p.author_id,
        p.created_at,
        p.view_count,
        COUNT(l.id) as like_count,
        COUNT(c.id) as comment_count,
        -- Trending score calculation
        (
            COUNT(l.id) * 2 + 
            COUNT(c.id) * 3 + 
            p.view_count * 0.1 +
            CASE 
                WHEN p.created_at > NOW() - INTERVAL '7 days' THEN 50
                WHEN p.created_at > NOW() - INTERVAL '30 days' THEN 20
                ELSE 0
            END
        ) as trending_score,
        DENSE_RANK() OVER (ORDER BY 
            (COUNT(l.id) * 2 + COUNT(c.id) * 3 + p.view_count * 0.1) DESC
        ) as trend_rank
    FROM posts p
    LEFT JOIN likes l ON p.id = l.post_id
    LEFT JOIN comments c ON p.id = c.post_id
    WHERE p.status = 'published'
        AND p.created_at > NOW() - INTERVAL '90 days'
    GROUP BY p.id, p.title, p.author_id, p.created_at, p.view_count
    HAVING COUNT(l.id) > 0 OR COUNT(c.id) > 0
)

-- Main query combining all CTEs
SELECT 
    u.username,
    u.total_posts,
    u.total_comments,
    u.post_rank,
    ROUND(u.post_percentile::numeric, 3) as post_percentile,
    COALESCE(tp.trending_score, 0) as best_trending_score,
    COALESCE(tp.trend_rank, 999) as best_trend_rank,
    ch.path as category_path,
    -- JSON aggregation for posts
    JSON_AGG(
        JSON_BUILD_OBJECT(
            'title', tp.title,
            'trending_score', tp.trending_score,
            'like_count', tp.like_count,
            'comment_count', tp.comment_count
        ) ORDER BY tp.trending_score DESC
    ) FILTER (WHERE tp.id IS NOT NULL) as trending_posts
FROM user_stats u
LEFT JOIN trending_posts tp ON u.id = tp.author_id AND tp.trend_rank <= 5
LEFT JOIN posts p ON u.id = p.author_id AND p.id = tp.id
LEFT JOIN post_categories pc ON p.id = pc.post_id
LEFT JOIN category_hierarchy ch ON pc.category_id = ch.id
WHERE u.post_rank <= 100
GROUP BY 
    u.id, u.username, u.total_posts, u.total_comments, 
    u.post_rank, u.post_percentile, tp.trending_score, tp.trend_rank, ch.path
ORDER BY u.post_rank, COALESCE(tp.trending_score, 0) DESC;

-- Advanced analytics query
WITH monthly_metrics AS (
    SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as new_users,
        COUNT(*) FILTER (WHERE is_active = true) as active_users,
        LAG(COUNT(*)) OVER (ORDER BY DATE_TRUNC('month', created_at)) as prev_month_users
    FROM users 
    WHERE created_at >= NOW() - INTERVAL '12 months'
    GROUP BY DATE_TRUNC('month', created_at)
)
SELECT 
    month,
    new_users,
    active_users,
    prev_month_users,
    CASE 
        WHEN prev_month_users > 0 
        THEN ROUND(((new_users - prev_month_users) * 100.0 / prev_month_users), 2)
        ELSE NULL 
    END as growth_rate_percent,
    SUM(new_users) OVER (ORDER BY month ROWS UNBOUNDED PRECEDING) as cumulative_users
FROM monthly_metrics
ORDER BY month;
```

## Tables {#tables}

### Basic Table

| Feature | Status | Priority | Assignee |
|---------|--------|----------|----------|
| User Authentication | ✅ Complete | High | Alice |
| Dashboard UI | 🔄 In Progress | Medium | Bob |
| API Integration | ⏳ Pending | High | Charlie |
| Testing Suite | ❌ Not Started | Low | David |

### Complex Table with Alignment

| Left Aligned | Center Aligned | Right Aligned | Default |
|:-------------|:--------------:|--------------:|---------|
| Lorem ipsum dolor sit amet | Centered content | $1,234.56 | Regular |
| Short | Mid | $999,999.99 | Text |
| Very long content that spans multiple words | Center | $0.01 | Content |

### Advanced Table

| Technology | Type | Learning Curve | Popularity | Use Case |
|------------|------|----------------|------------|----------|
| React | Frontend Library | Medium | ⭐⭐⭐⭐⭐ | Single Page Applications |
| Vue.js | Frontend Framework | Easy | ⭐⭐⭐⭐ | Progressive Web Apps |
| Angular | Frontend Framework | Hard | ⭐⭐⭐ | Enterprise Applications |
| Node.js | Runtime | Medium | ⭐⭐⭐⭐⭐ | Backend Services |
| Python | Programming Language | Easy | ⭐⭐⭐⭐⭐ | Data Science, Backend |
| TypeScript | Programming Language | Medium | ⭐⭐⭐⭐ | Type-safe JavaScript |

## Mathematical Expressions {#math}

### Inline Math

The quadratic formula is $x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}$ and Einstein's mass-energy equivalence is $E = mc^2$.

### Block Math

$$
\begin{align}
\nabla \times \vec{\mathbf{B}} -\, \frac1c\, \frac{\partial\vec{\mathbf{E}}}{\partial t} &= \frac{4\pi}{c}\vec{\mathbf{j}} \\
\nabla \cdot \vec{\mathbf{E}} &= 4 \pi \rho \\
\nabla \times \vec{\mathbf{E}}\, +\, \frac1c\, \frac{\partial\vec{\mathbf{B}}}{\partial t} &= \vec{\mathbf{0}} \\
\nabla \cdot \vec{\mathbf{B}} &= 0
\end{align}
$$

### Complex Mathematical Expressions

The Fourier transform of a function $f(x)$ is defined as:

$$
\mathcal{F}[f(x)] = F(\omega) = \int_{-\infty}^{\infty} f(x) e^{-i\omega x} dx
$$

Matrix operations:

$$
\begin{bmatrix}
a_{11} & a_{12} & \cdots & a_{1n} \\
a_{21} & a_{22} & \cdots & a_{2n} \\
\vdots & \vdots & \ddots & \vdots \\
a_{m1} & a_{m2} & \cdots & a_{mn}
\end{bmatrix}
\begin{bmatrix}
x_1 \\
x_2 \\
\vdots \\
x_n
\end{bmatrix}
=
\begin{bmatrix}
b_1 \\
b_2 \\
\vdots \\
b_m
\end{bmatrix}
$$

## Media and Embeds {#media}

### Images

![Sample Image](https://plus.unsplash.com/premium_photo-1750891220483-4288ebf980a5?q=80&w=1674&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)

### Code with Copy Button

```bash
# Installing dependencies
npm install react react-dom typescript @types/react @types/react-dom

# Setting up the development server
npm run dev

# Building for production
npm run build

# Running tests
npm test
```

## Advanced Features {#advanced}

### Custom Blockquotes

> **💡 Tip**: This is a tip blockquote with an emoji icon.

> **⚠️ Warning**: This is a warning blockquote that stands out.

> **❌ Error**: This represents an error state or critical information.

> **✅ Success**: This shows successful completion or positive feedback.

### Admonition Blocks

:::note
This is a note admonition. It provides additional information that might be helpful.
:::

:::tip
This is a tip admonition. It offers helpful suggestions or best practices.
:::

:::warning
This is a warning admonition. It alerts users to potential issues or important considerations.
:::

:::danger
This is a danger admonition. It warns about critical issues or destructive actions.
:::

## Performance Content {#performance}

This section contains repetitive content to increase the document length and test scroll performance.

### Lorem Ipsum Section 1

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.

### Lorem Ipsum Section 2

Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur.

At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga.

### Lorem Ipsum Section 3

Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae.

Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

### Lorem Ipsum Section 4

Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit.

### Lorem Ipsum Section 5

Sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.

Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?

## Extended Examples {#examples}

### Complete React Hook Example

Here's a comprehensive example of a custom React hook for managing form state:

```jsx
import { useState, useCallback, useMemo } from 'react';

function useForm(initialValues, validationRules = {}) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = useCallback((fieldName, value) => {
    const rules = validationRules[fieldName];
    if (!rules) return '';

    for (const rule of rules) {
      const error = rule(value, values);
      if (error) return error;
    }
    return '';
  }, [validationRules, values]);

  const handleChange = useCallback((name) => (event) => {
    const value = event.target.value;
    setValues(prev => ({ ...prev, [name]: value }));
    
    if (touched[name]) {
      const error = validate(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  }, [touched, validate]);

  const handleBlur = useCallback((name) => () => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validate(name, values[name]);
    setErrors(prev => ({ ...prev, [name]: error }));
  }, [validate, values]);

  const handleSubmit = useCallback((onSubmit) => async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    const newErrors = {};
    let hasErrors = false;

    Object.keys(validationRules).forEach(fieldName => {
      const error = validate(fieldName, values[fieldName]);
      newErrors[fieldName] = error;
      if (error) hasErrors = true;
    });

    setErrors(newErrors);
    setTouched(Object.keys(validationRules).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {}));

    if (!hasErrors) {
      try {
        await onSubmit(values);
      } catch (error) {
        console.error('Form submission error:', error);
      }
    }

    setIsSubmitting(false);
  }, [validate, values, validationRules]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  const isValid = useMemo(() => {
    return Object.values(errors).every(error => !error) && 
           Object.keys(touched).length > 0;
  }, [errors, touched]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    handleChange,
    handleBlur,
    handleSubmit,
    reset
  };
}

// Usage example
function ContactForm() {
  const validationRules = {
    name: [
      (value) => !value ? 'Name is required' : '',
      (value) => value.length < 2 ? 'Name must be at least 2 characters' : ''
    ],
    email: [
      (value) => !value ? 'Email is required' : '',
      (value) => !/\S+@\S+\.\S+/.test(value) ? 'Email is invalid' : ''
    ],
    message: [
      (value) => !value ? 'Message is required' : '',
      (value) => value.length < 10 ? 'Message must be at least 10 characters' : ''
    ]
  };

  const form = useForm(
    { name: '', email: '', message: '' },
    validationRules
  );

  const handleSubmit = async (formData) => {
    console.log('Submitting:', formData);
    // API call would go here
    await new Promise(resolve => setTimeout(resolve, 1000));
    alert('Form submitted successfully!');
    form.reset();
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)}>
      <div>
        <label htmlFor="name">Name:</label>
        <input
          id="name"
          type="text"
          value={form.values.name}
          onChange={form.handleChange('name')}
          onBlur={form.handleBlur('name')}
        />
        {form.touched.name && form.errors.name && (
          <span className="error">{form.errors.name}</span>
        )}
      </div>

      <div>
        <label htmlFor="email">Email:</label>
        <input
          id="email"
          type="email"
          value={form.values.email}
          onChange={form.handleChange('email')}
          onBlur={form.handleBlur('email')}
        />
        {form.touched.email && form.errors.email && (
          <span className="error">{form.errors.email}</span>
        )}
      </div>

      <div>
        <label htmlFor="message">Message:</label>
        <textarea
          id="message"
          value={form.values.message}
          onChange={form.handleChange('message')}
          onBlur={form.handleBlur('message')}
          rows={4}
        />
        {form.touched.message && form.errors.message && (
          <span className="error">{form.errors.message}</span>
        )}
      </div>

      <button 
        type="submit" 
        disabled={!form.isValid || form.isSubmitting}
      >
        {form.isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}
```

### Additional Content for Scrolling

This is additional content to make the document longer and test the scroll progress bar functionality. The content continues with more technical examples and detailed explanations.

#### Web Performance Optimization

Performance optimization is crucial for modern web applications. Here are key strategies:

1. **Code Splitting**: Load only the code that's needed for the current page
2. **Image Optimization**: Use modern formats like WebP and proper sizing
3. **Caching Strategies**: Implement service workers and CDN caching
4. **Bundle Analysis**: Regularly analyze bundle sizes and dependencies
5. **Critical Path Optimization**: Prioritize above-the-fold content

#### Database Design Patterns

When designing databases for scalable applications, consider these patterns:

1. **Normalization vs Denormalization**: Balance data integrity with query performance
2. **Indexing Strategy**: Create indexes for frequently queried columns
3. **Partitioning**: Split large tables across multiple storage units
4. **Read Replicas**: Use separate read instances for query load distribution
5. **Connection Pooling**: Manage database connections efficiently

#### Security Best Practices

Security should be built into every layer of the application:

1. **Input Validation**: Always validate and sanitize user input
2. **Authentication**: Implement secure authentication mechanisms
3. **Authorization**: Use role-based access control (RBAC)
4. **Data Encryption**: Encrypt sensitive data both at rest and in transit
5. **Regular Updates**: Keep dependencies and systems updated

#### Testing Strategies

A comprehensive testing strategy includes multiple levels:

1. **Unit Tests**: Test individual functions and components
2. **Integration Tests**: Test how different parts work together
3. **End-to-End Tests**: Test complete user workflows
4. **Performance Tests**: Ensure the application performs under load
5. **Security Tests**: Identify potential vulnerabilities

#### DevOps and Deployment

Modern deployment practices ensure reliable and fast delivery:

1. **Continuous Integration**: Automatically test code changes
2. **Continuous Deployment**: Automatically deploy tested code
3. **Infrastructure as Code**: Manage infrastructure through version control
4. **Monitoring and Alerting**: Track application health and performance
5. **Rollback Strategies**: Plan for quick recovery from issues

## Conclusion

This comprehensive test post demonstrates all the advanced markdown features available on this blog platform. The scroll progress bar should now be working correctly, showing the progress as you scroll through this lengthy document.

Key features demonstrated include:

- **Rich text formatting** with various styling options
- **Syntax highlighting** for multiple programming languages
- **Mathematical expressions** both inline and block
- **Advanced tables** with alignment and complex data
- **Code blocks** with copy functionality
- **Custom blockquotes** and admonitions
- **Extended content** for scroll testing

The platform successfully renders all these features while maintaining performance and providing a smooth reading experience. The scroll progress bar provides visual feedback about reading progress through long-form content.

Thank you for reading this comprehensive test post! 🚀

---
