---
title: "Deterministic Architecture: Input-Lockstep & Data-Driven Tooling"
date: 2025-07-23
summary: Analyzing the bandwidth efficiency of deterministic state synchronization vs. snapshot interpolation. Plus, a look at decoupling gameplay logic using ScriptableObjects for rapid prototyping. Read on to find out what's up.
slug: proj_0003_kill_bad_guys
---
:::tip
Open with 

**Unity 2020.3 LTS or newer**
:::

![Thumbnail](https://cdn.ujjwalvivek.com/posts/media/fake_mp_1.webp)

## The Problem: Network Bandwidth vs. Simulation Fidelity 

Traditional state sync requires serializing transforms for every entity, leading to exponential bandwidth growth. By implementing a deterministic lockstep model, we transmit only user inputs, reducing network payload by 90%.

**Deterministic input-lockstep** can make a singleplayer Unity scene feel like a LAN match while sending only a **handful of bytes** per frame. 

Couple that with a **ScriptableObject-driven FPS toolkit** and you get a compact playground for learning advanced architecture without spinning up servers or Photon rooms. 

<mark>System Constraints</mark>

- **Bandwidth Target**: < 2KB/s per client (Cellular Data friendly).
- **Architecture**: Peer-to-Peer (No dedicated server costs).
- **Latency Tolerance**: High (Acceptable for co-op/strategy, unacceptable for competitive twitch shooters).

This post dissects both halves of the project:

- Module 1 (minimal byte coordination system)
- Module 2 (weapon system with ScriptableObjects)

and distills transferable patterns you can graft onto your own games.

## Architectural Constraints: The Case for Lockstep

Lockstep minimizes bandwidth but introduces input latency. This project explores that constraint boundary.

Real-time networking is heavy. You must serialize `world state`, `reconcile divergent timelines`, and take care of `latency spikes`. 

>**Lockstep simulation sidesteps that by sharing just the player inputs, not the whole world**, then running identical deterministic code on every peer. 

If you only need the *feeling* of online play (e.g., classroom demos, single-player roguelikes that replay friends’ ghosts, or early prototyping), the savings are dramatic, honestly measured in kilobytes per minute rather than megabytes.

## Module 1: Deterministic State Synchronization

### 1. Input Harvesting

```csharp
// LocalPlayerInput.cs
void Update() {
    controller.ForwardInput = Input.GetAxisRaw("Vertical");
    controller.TurnInput    = Input.GetAxisRaw("Horizontal");
}
```

The script funnels two floats per frame into a plain C\# POCO. 

**Because only inputs travel, bandwidth scales with *players*, not *entities*** <br/>
That's deterministic lockstep.

### 2. Deterministic Movement Core

```csharp
// LocalPlayerMovement.cs (excerpt)
public Vector2 LocalPosition() => new(rb.position.x, rb.position.z);
public float   LocalYaw()      => rb.rotation.eulerAngles.y;

void FixedUpdate() {
    rb.MovePosition(transform.position + transform.forward * _speed * ForwardInput * Time.fixedDeltaTime);
    rb.MoveRotation(rb.rotation * Quaternion.Euler(0f, TurnInput * _turnRate, 0f));
}
```

<mark>Key traits</mark>

* **FixedUpdate-only physics** ensures identical step counts across instances.
* All floats are clamped and rounded consistently to avoid desync-inducing drift.

### 3. Remote Echo

```csharp
// RemotePlayerMovement.cs (excerpt)
var src = _local.LocalPosition();
_remoteRb.MovePosition(new Vector3(src.x, yFloor, src.y + _offsetZ));
_remoteRb.MoveRotation(Quaternion.Euler(0, _local.LocalYaw(), 0));
```

A separate GameObject replays the authoritative player’s position with an offset, producing the *illusion* of a second participant inside the same process.

```bash
Coordination System Data Flow
┌─────────────────┐    ┌───────────────────┐    ┌────────────────────┐
│ LocalPlayerInput│───▶│LocalPlayerMovement│───▶│RemotePlayerMovement│
│                 │    │                   │    │                    │
│ ForwardInput    │    │ ProcessActions()  │    │ ProcessMovement()  │
│ TurnInput       │    │ LocalPosition()   │    │ ProcessRotation()  │
│                 │    │ LocalYaw()        │    │                    │
└─────────────────┘    └───────────────────┘    └────────────────────┘
        │                        │                        │
        ▼                        ▼                        ▼
   Input.GetAxis()         Rigidbody Physics        Mirror Position
   [2 floats/frame]        [Deterministic]          [+20 Z offset]

```

:::note
Takeaway

When simulation is deterministic, *any* machine can be the **server**. By syncing inputs instead of object states, network bandwidth scales with Player Count (O(n)) rather than Entity Count (O(e)) without sockets or peer discovery. In a game with 100 bullets and 2 players, we send 2 packets, not 102.
:::

## Module 2: Data-Driven Content Pipeline

### 1. Data-Driven Architecture

```csharp
// Scripts/Task B/Weapon Architecture/Item.cs
public abstract class Item : MonoBehaviour {
    public WeaponData weaponData;
    public abstract void UseWeapon();
}
```

All firearms inherit from `Item`, treating behaviour as **strategy objects** while parameters live in `ScriptableObjects`:

```csharp
// WeaponData (ScriptableObject)
public float damage;
public float fireRate;
public int   magazineSize;
public float recoil;
public Sprite hudIcon;
```

This **decouples content from code**, empowering designers to clone new guns without touching a compiler.

```bash
FirstPersonController Integration
┌─────────────────────────────────────────────────────────────┐
│                FirstPersonController                        │
├─────────────────────────────────────────────────────────────┤
│  Movement        │  Camera          │  Weapon Manager       │
│                  │                  │                       │
│  WASD Control    │  Mouse Look      │  Item[] weapons       │
│  GroundCheck     │  Recoil System   │  EquipItems(index)    │
│                  │  CamShake        │  UseWeapon() Loop     │
└──────────────────┴──────────────────┴───────────────────────┘
                   ┌──────────────────┼──────────────────┐
                   ▼                  ▼                  ▼
           ┌─────────────┐    ┌───────────────┐    ┌─────────────┐
           │WeaponHandler│    │WeaponVariables│    │  VisualsUI  │
           │             │    │               │    │             │
           │Fire Control │    │ Damage        │    │ Crosshair   │
           │Reload Logic │    │ FireRate      │    │ Ammo Count  │
           └─────────────┘    └───────────────┘    └─────────────┘
```

### 2. Runtime Assembly

At `Start`, `WeaponHandler` loops through the equipped `Item[]`, activating the one indexed by the HUD. Switching weapons merely toggles GameObjects and pulls stats from the associated `WeaponData`.

### 3. Recoil \& Camera Harmony

Camera kick has always been an addictive element

`FirstPersonController.Recoil(float amount, float revert)`

So any new firearm automatically inherits the feedback loop. **Separating view recoil from bullet spread mirrors industry practice in shooters like Apex**.

```bash
Weapon System Architecture
                    ┌─────────────────┐
                    │     Item        │
                    │   (Abstract)    │
                    │                 │
                    │ + weaponData    │
                    │ + UseWeapon()   │
                    └─────────┬───────┘
                              │
               ┌──────────────┼──────────────┐
               │              │              │
               ▼              ▼              ▼
    ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
    │SingleShotWeapons│ │  HeavyWeapons   │ │   Future...     │
    │                 │ │                 │ │                 │
    │ + UseWeapon()   │ │ + UseWeapon()   │ │ + UseWeapon()   │
    │   - Single fire │ │   - Auto fire   │ │   - Custom      │
    └─────────────────┘ └─────────────────┘ └─────────────────┘
```

### 4. UI Synchronization

`VisualsUI` binds `WeaponVariables.bulletsLeft` to TMPro counters each frame, proving that **reactive UIs aren’t exclusive to UIToolkit or ECS**

<mark>classic MonoBehaviours suffice if the data model stays clean.</mark>

## Putting It Together

| Feature                | CoordinationSystem                         | Inventory-WeaponSystem                           |
| :--------------------- | :----------------------------------------- | :----------------------------------------------- |
| Sync granularity       | Two floats + one yaw per frame             | None (local-only)                                |
| Determinism guardrails | Fixed timestep, clamped input              | ScriptableObjects avoid runtime mutation         |
| Extensibility          | Drop-in transport layer later              | Add `Item` subclasses or new `WeaponData` assets |
| Learning focus         | Lockstep \& client prediction fundamentals | Data-oriented design \& modular abstraction      |

## How to Explore the Repo

```bash
#clone the repository
git clone https://github.com/ujjwalvivek/UnityCoordinationFramework.git
cd UnityCoordinationFramework

# Open with Unity 2020.3 LTS or newer.
```

**Run** `Main.unity` and pick either demo:
* **Task A** scene, you drive the local cube and watch its `network twin`.
* **Task B** scene, you scroll mouse-wheel to swap guns, fire to feel recoil.

### Suggested Experiments

* **Instrument bandwidth:** Serialize `ForwardInput` and `TurnInput` to JSON, log payload size, and compare with full transform sync.

* **Create a shotgun:** Duplicate a `WeaponData`, crank `fireRate`, widen bullet spread, and assign a new muzzle flash prefab.

## Critical Trade-offs & Limitations

Cross-platform determinism fails if you rely on Unity physics; Floating Point Determinism is a major challenge, consider DOTS Physics or a fixed-point library when porting to mobile-desktop cross-play.

**Rollback vs. Lockstep:** Lockstep halts on missing inputs, whereas modern games hybridize with client-side prediction and server reconciliation to mask jitter.

- **Pros**: Extremely low bandwidth; Cheating is harder (simulation is deterministic).
- **Cons**: Input Lag. Since the simulation must wait for inputs from all peers, the game feels sluggish on high-latency connections (>150ms ping).
- **Verdict**: Ideal for RTS, Turn-Based, or LAN Co-op. Not viable for Competitive FPS without adding Rollback Netcode (GGPO).

## Conclusion

The Unity Coordination Framework is more than a quirky demo; **it’s a cheat-sheet for deterministic simulation and modular gunplay**. 

Whether you aspire to ship an offline roguelite with ghost replays or prototype a competitive shooter, `the patterns here scale`. 

<mark>Start small</mark>

Sync only inputs, hoist tunables into ScriptableObjects, and let Unity’s inspector work. With those pillars in place, genuine networking and/or richer combat becomes an iterative, and not monumental, next step. Happy hacking!

---
