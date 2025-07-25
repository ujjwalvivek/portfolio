---
title: "GreedySnek: A 3D Snake Game"
date: 2025-07-21
summary: Sometimes the simplest concepts lead to the most complex solutions. This project is now archived, but the lessons it taught me about game development, networking, and knowing when to stop are still very much alive.
slug: proj_0002_greedysnek
---

<iframe width="100%" height="500" src="https://www.youtube.com/embed/0Uv2LXfLRIM" frameborder="0" allowfullscreen></iframe>

#### A Game That Taught Me About Overengineering [ARCHIVED]

>**Project Status**: Permanently Archived <br/>
>**Platform**: Unity 2021.3.18f1, Android <br/>
>**Last Commit**: March 2023 <br/>
>**Networking**: Mirror <br/>
>**License**: MIT <br/>
## What Started as a Weekend Project

GreedySnek began with a deceptively simple premise: 

---

`Take the classic Nokia snake game we all know and lovee, throw it into a 3D space, and add multiplayer functionality. "How hard could it be?" I thought.` 

---

Two months later, I was still debugging edge cases and questioning whether I'd overcomplicated something that should have been straightforward.[^1]

The result was a **3D multiplayer snake game** built in Unity with C\#, featuring both singleplayer and multiplayer modes, complete with network synchronization and a custom Java-based Unity plugin for Android alerts. 

Here's what I actually learned from building something that nobody plays; with the actual code that shows both the good decisions and the mistakes.

## The Architecture That Grew

What makes GreedySnek interesting isn't just the 3D snake mechanics; it's how the project evolved into a well-structured learning exercise in Unity development:

### Clean Separation of Concerns

<mark>The Three-Headed Snake</mark>

One thing I got right with GreedySnek was the **modular project structure**. Instead of cramming everything into a single messy folder, I separated the game into three completely independent modules. Here's how the project is organized. [^1]

```bash
GreedySnek/
├── .idea/                          # JetBrains IDE configuration
├── AndroidBuild/                   # Pre-built APK files
├── Assets/                         # Unity project assets
│   ├── _Home/                      # Main menu system (standalone)
│   ├── _Singleplayer/              # Offline snake game (standalone)
│   ├── _Multiplayer/               # Network-enabled version (standalone)
│   ├── Plugins/                    # Custom Unity Alert Plugin (Java)
│   └── Settings/                   # Unity URP render pipeline settings
├── Packages/                       # Unity Package Manager dependencies
├── ProjectSettings/                # Unity project configuration
├── .gitignore                      # Git ignore rules
├── .vsconfig                       # Visual Studio configuration
├── LICENSE                         # MIT license
└── README.md                       # Project documentation
```

### The Modular Design Philosophy

Each of the three main modules `_Home` `_Singleplayer` `_Multiplayer` can function completely independently. You could delete any one of them and the others would still compile and run. 

This wasn't just good organization; it was **survival architecture** for a developer who kept changing his mind about features. Sometimes redundancy is a feature, not a bug.

**Why the underscore prefixes?** Simple. They force these folders to the top of Unity's Project window, making navigation faster during development.

### What Each Module Contains

`_Home/ - The Hub`  
Contains all main menu scripts, UI elements, and navigation logic. This handles the three-button interface mentioned in the repository:

- Task A (Single-player)
- Task B (Multiplayer)
- Task C (Custom alert system)

---

`_Singleplayer/ - The Safe Zone`  
The offline version with touch controls, basic snake mechanics, and collision detection. This was my testing ground for core gameplay before attempting networking.

---

`_Multiplayer/ - The Chaos`  
Mirror networking implementation, server-client architecture, and all the networking headaches. Completely isolated from singleplayer code.

---

`Plugins/ - The Over Engineering`  
Custom Java plugin for Unity Android alerts. Two weeks of work for something Unity's built-in notification system could have handled. Classic case of solving the wrong problem.

### Why This Structure Actually Worked

Despite all the technical problems with GreedySnek, the modular architecture was one decision I got right. It allowed me to:

* Debug in isolation
* Iterate quickly
* Deploy selectively
* Learn incrementally

## The Technical Implementation

### Core Snake Mechanics in 3D Space

Converting 2D snake movement to 3D required solving a fundamental problem: 

---

`How tf do you maintain intuitive controls when players can move in any direction?`

---

My solution was constraining movement to continuous forward motion with left/right steering, similar to how you'd control a car. Here's the core movement system from the singleplayer version:

```csharp
private void MoveSnek()
{
    var snekPos = transform;
    
    // Continuous forward movement
    snekPos.position += snekPos.forward * (moveSpeed * Time.deltaTime);
    
    // Touch and keyboard steering
    float steerDirection = 0f;
    if (Input.touchCount > 0)
    {
        Touch touch = Input.GetTouch(0);
        if (touch.position.x < Screen.width / 2f)
            steerDirection = -1f;
        else
            steerDirection = 1f;
    }
    else
    {
        steerDirection = Input.GetAxis("Horizontal");
    }
    
    snekPos.Rotate(Vector3.up * (steerDirection * steerSpeed * Time.deltaTime));
}
```

<mark> Key Implementation Detail </mark>

Instead of traditional transform.position updates, I used a **segment queue system** where each body segment tracks the **position history** of the segment in front of it. This prevents the `accordion effect` where body segments bunch up or stretch unnaturally.

```csharp
private void FixedUpdate()
{
    // Store position history for body segments to follow
    posHistory.Insert(0, this.transform.position);
}

// Move body parts along the path
int index = 0;
foreach (var body in bodyParts) 
{
    Vector3 point = posHistory[Mathf.Clamp(index * bodyGap, 0, posHistory.Count - 1)];
    
    // Smooth movement toward the historical position
    Vector3 moveDirection = point - body.transform.position;
    body.transform.position += moveDirection * (bodySpeed * Time.deltaTime);
    body.transform.LookAt(point);
    
    index++;
}
```

### The Mirror Networking Caveat

The multiplayer implementation uses Mirror networking with a `server-authoritative approach` instead of the more robust Photon Fusion. 

Why? Because sometimes you need to match your tools to your scope, and Mirror was perfectly adequate for a small-scale learning project. Dont fall into the trap of **scope creep**.

```csharp
public class SnakeMovement : NetworkBehaviour
{
    [SerializeField] float rotationSpeed = 180f, speedChange = 0.5f;
    
    [SerializeField]
    [SyncVar]
    float speed = 3f;
    
    [ClientCallback]
    void Update()
    {
        // Only the client controlling this snake can move it
        transform.Translate(Vector3.forward * (Speed * Time.deltaTime));
        
        float steerDirection = 0f;
        if (Input.touchCount > 0)
        {
            Touch touch = Input.GetTouch(0);
            steerDirection = (touch.position.x < Screen.width / 2f) ? -1f : 1f;
        }
        else
        {
            steerDirection = Input.GetAxis("Horizontal");
        }
        
        transform.Rotate(Vector3.up * (rotationSpeed * Time.deltaTime * steerDirection));
    }
}
```

The Server Authority Model setup reveals the complexity hidden beneath simple concepts:
-  Snake head position is server-authoritative
- Client prediction for movement smoothness
- Server-client architecture with IP-based connections
- Real-time synchronization of multiple growing snakes in 3D space
- Graceful handling of player disconnections and network lag

---

<mark>The Networking Decision</mark>

I used `[ClientCallback]` for movement, meaning each client controls their own snake but the server validates everything. This creates responsive movement but can lead to **desynchronization issues**.

:::warning 
Heads Up!

Here's an important detail for anyone trying to run this project.

**Mirror might not work out of the box.**

The repository includes this warning in the README; you need to delete the Mirror folder in `_Multiplayer/Assets/` and re-import it through Unity's Package Manager.

This happened because Mirror updates frequently and the version I committed became incompatible with newer Unity versions. 
:::

>It's a subtle reminder that networking libraries evolve faster than archived projects.
### Collision Detection Reality

Network collision detection is a nightmare. My solution was **predictive collision on client, validation on server**. 

When a snake crashes, the client immediately stops movement while waiting for server confirmation. This prevents the "*I didn't crash on my screen*" problem. The collision system reveals the actual complexity of networked game logic:

```csharp
[ServerCallback]
void OnTriggerEnter(Collider other)
{
    // Prevent self-collision detection
    if (other.TryGetComponent(out NetworkIdentity networkIdentity)
        && networkIdentity.connectionToClient == connectionToClient)
        return;
        
    switch (other.tag)
    {
        case "Points":
            if (!hasCollided)
            {
                hasCollided = true;
                score += points;
                scoreText.text = score.ToString();
            }
            hasCollided = false;
            return;
            
        case "Border":
        case "Player":
        case "Tail":
        case "Danger":
            DestroySelf();
            break;
    }
}
```

<mark>The Problem</mark> 

Notice the `hasCollided` flag? This was my hacky solution to prevent duplicate collision detection, but it creates a race condition when multiple players hit the same food simultaneously.


## What Actually Went Wrong

### The Food Synchronization Bug

The most embarrassing bug that's still unfixed after 2+ years. When multiple players grab food simultaneously, the server needs to decide who gets it. My implementation has a race condition that occasionally spawns duplicate food items.

```csharp
void ServerHandleFoodEaten(GameObject playerWhoAte)
{
    if (gameObject == playerWhoAte)
        Speed += speedChange;
}
```

<mark>The Race Condition</mark>

Multiple players can trigger `OnTriggerEnter` on the same food object before the server destroys it. My `hasCollided` flag doesn't prevent this because it's per-player, not per-food-item.

<mark>What I Should Have Done Instead</mark>

```csharp
// Better approach I never implemented
if (food.isConsumed) return; // Check food state first
food.isConsumed = true;      // Atomic flag on the food object
```

### Performance Crater

The game runs at 60fps with 2 players. With 4 players and longer snakes, it drops to 20fps. The culprit? **Inefficient mesh generation for snake bodies**. I'm regenerating the entire snake mesh every frame instead of using a more intelligent segmented approach.

Looking at the body spawning system, the performance problem becomes obvious:

```csharp
public void GrowSnake() 
{
    // Instantiate body instance and add it to the list
    GameObject body = Instantiate(bodyPrefab);
    bodyParts.Add(body);
}
```

<mark>The Math</mark>

Every time the snake grows, I `instantiate` a new GameObject. A 50-segment snake generates 200 vertices per frame. With 4 players, that's 800 vertices being recalculated 60 times per second. 

---

>No object pooling. No optimizations. 

---
No wonder it chugs. Each body segment runs this calculation every frame:

```csharp
Vector3 moveDirection = point - body.transform.position;
body.transform.position += moveDirection * (bodySpeed * Time.deltaTime);
body.transform.LookAt(point);
```

That's 200 `LookAt()` calls per frame with 4 players. 

:::danger
Look Out!

`LookAt()` involves quaternion calculations (ffs) expensive operations happening hundreds of times per frame. Use it wisely.
:::

### Networking Bandwidth

Each snake broadcasts its position data to all clients. For a 4-player game with 30-segment snakes, that's **120 position updates per frame** across the network. I never implemented proper data compression or delta updates. Every snake position gets synchronized via Mirror's automatic `SyncVar` system:

```c#
[SyncVar]
float speed = 3f;  // This syncs every time it changes
```

<mark>The Bandwidth Problem</mark> 

Each snake's transform is being synchronized to all clients every frame. With 4 players, that's **4 position Updates × 4 clients × 60fps = 960 network Messages Per Second** for just basic movement.

<mark>What I Should Have Done</mark>

Delta compression, sending only rotation changes, or interpolation between fewer updates.

### Android Plugin Overkill

I wrote a custom Java plugin to handle Android notifications. This was completely unnecessary and took 2 weeks. Unity's built-in notification system would have worked fine. Classic over-engineering that taught me to exhaust simple solutions first.

```c#
// What I built: Custom native plugin integration
// What I needed: Unity's built-in notification system
```

>Was it necessary? Probably not. Did I learn about Unity's native plugin system? Absolutely.

## And, Documentation Matters

The detailed setup instructions in the README including specific steps for Mirror networking configuration and multi-device testing weren't just for others. Future me needed them just as much when returning to the project years later.

## The Brutal Technical Reality


| Some Stats                  |                                               |
| --------------------------- | --------------------------------------------- |
| **Lines of Code**           | ~25,000 (appropriately sized)                 |
| **Development Time**        | 2 months active, 2 years abandoned            |
| **Architecture Decision**   | Clean modular separation actually worked well |
| **Biggest Performance Bug** | `LookAt()` calculations in body movement      |
| **Unfixed Race Condition**  | Food collision detection                      |
| **Missing Feature**         | Object pooling for snake segments             |
| **Networking Flaw**         | No bandwidth optimization                     |


## What The Code Actually Teaches

:::tip
Good Patterns I Used

<mark>Modular Architecture</mark>
Completely separate singleplayer and multiplayer implementations.

<mark>Position History System</mark>
Elegant solution for smooth body following.

<mark>Touch Controls</mark>
Proper mobile input handling alongside keyboard.

<mark>Event-Driven Design</mark>
Clean separation between food consumption and speed increases.
:::

---

:::danger
Bad Patterns That Hurt

<mark>No Object Pooling</mark>
Instantiating GameObjects during gameplay.

<mark>Expensive Per-Frame Calculations</mark>
`LookAt()` on every body segment.

<mark>Race Condition Handling</mark>
Using boolean flags instead of proper state management.

<mark>Network Spam</mark>
No optimization of synchronized data.
:::

---

:::note
What I'd Do Differently Today

<mark>Object Pooling</mark>
Pre-allocate snake segments instead of creating or destroying them.

<mark>Delta Compression</mark>
Only send position changes, not absolute positions.

<mark>Client-Side Prediction</mark>
More aggressive prediction with rollback on mismatch.

<mark>Simpler Architecture</mark>
Skip the modular approach for a project this small.

<mark>Skip Android</mark>
Web build would have been faster to iterate.
:::

## Why Did I Archive It?

GreedySnek taught me that **shipping something functional beats perfecting something unused**. The game works well enough to demonstrate 3D snake mechanics and multiplayer networking, but poorly enough to highlight every optimization mistake.

The code shows the evolution of a developer learning Unity networking - from the basic single-player controller to the more complex networked version with Mirror. `It's honest code that represents a specific moment in my learning journey.`

![Screenshot](https://cdn.ujjwalvivek.com/posts/media/greedysnek.png)

The code is public because broken projects teach more than perfect ones. If you're building your first networked Unity game, GreedySnek shows you exactly what happens when you don't plan for scale, don't optimize early, and definitely don't know when to stop adding features.

<mark>The Real Learning</mark>

* Before implementing multiplayer, understand your bandwidth budget. 
* Before calling `LookAt()` 200 times per frame, consider the performance cost. 
* Before building custom plugins, exhaust built-in solutions.

>*Sometimes the best way to help other developers is to show them your mistakes before they make the same ones.*

## What You Can Take Away

>That complex solutions aren't always **better solutions** and `modularity is about knowing what NOT to separate as much as what to separate`

If you're working on your first Unity multiplayer project, GreedySnek demonstrates several practical concepts:

- Modular project structure. The overhead of separate folders is minimal, but the debugging benefits are significant.
- Mirror networking implementation for simple multiplayer games.
- Cross-platform deployment considerations for Unity projects.
- The importance of clear documentation for setup and configuration.

The complete source and build files are available in the repository[^1], including a gameplay recording (*windows build, not included*) that shows the final result in action. 

While the project is archived, `the techniques and patterns it demonstrates are still relevant for anyone learning Unity game development`

## And That's it! Phew

Here's a thought I'll leave you with. 
>Sometimes the best way to finish a project is to accept what it taught you and apply those lessons to the next one.

[^1]: https://github.com/ujjwalvivek/GreedySnek
