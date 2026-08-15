---
title: "第 2 章 · GameObject、组件与 Transform"
description: "理解 Unity 的世界观：场景是一棵对象树，GameObject 靠组件获得能力，Transform 决定位置/旋转/缩放；掌握父子关系、空物体与常用内置组件"
layout: "learn"
category: "unity"
weight: 2
keywords: ["GameObject", "组件", "Component", "Transform", "父子关系", "空物体", "预制体", "Inspector", "Unity基础"]
ShowToc: true
TocOpen: true
---

## 先建立直觉

Unity 的世界观只有一句话：**场景 = 一棵对象树，每个节点（GameObject）本身什么都不会，全靠挂上去的「组件」获得能力**。

- 一个空 GameObject 默认只有 `Transform` 这一个组件——它只能「存在于空间里」；
- 想让它「能被看到」，挂 `Mesh Renderer` + `Mesh Filter`；
- 想让它「被撞到」，挂 `Collider`；
- 想让它「按代码动」，挂你的 C# 脚本组件。

> 所以「做游戏」≈「往对象树上挂合适的组件」。这是和一般 OOP「对象自带方法」最大的不同——Unity 用**组合（Composition）而非继承**来组织能力。

## 它解决什么问题

1. **复用与解耦**：同样的 `Rigidbody` 组件可以挂在角色、箱子、子弹上，逻辑统一；
2. **可视化配置**：组件属性在 Inspector 里改，不用改代码重新编译；
3. **父子层级**：用树结构表达「车身带着轮子转」「角色带着武器动」。

```mermaid
flowchart TD
    Player[Player (空物体+脚本)] --> Body[Body (MeshRenderer)]
    Player --> Weapon[Weapon (子物体)]
    Player --> CharCtrl[CharacterController 组件]
    Player --> Rigid[Rigidbody 组件]
```

## 核心概念

### 1. Transform：每个物体的「空间身份证」

`Transform` 是**必带且不可移除**的组件，三个属性：

| 属性 | 含义 | 说明 |
|------|------|------|
| **Position** | 位置 (x, y, z) | 相对父物体的本地坐标 |
| **Rotation** | 旋转 (欧拉角) | 也可用 Quaternion 表示 |
| **Scale** | 缩放 | (1,1,1) 为原始大小 |

> **本地坐标 vs 世界坐标**：`transform.position` 是相对父物体的；`transform.localPosition` 同理。想拿「绝对世界坐标」用 `transform.position`。缩放同理有 `localScale` 与受父级影响的整体缩放。

### 2. 父子关系（Very Important）

把 B 拖到 A 下，B 成为 A 的子物体：

```csharp
// 运行时让 obj 成为 player 的子物体
obj.transform.SetParent(player.transform);
// 子物体会继承父物体的位移/旋转/缩放
```

**典型用途**：玩家角色带着武器、载具带着乘客、相机跟随目标。

### 3. 空物体（Empty GameObject）的妙用

`GameObject → Create Empty` 创建一个没有外观的空物体，常用来：

- 当「逻辑根节点」组织子物体；
- 当「挂载点」：把武器挂到 `Hand` 空物体下，换武器只换子物体；
- 当「文件夹」整理 Hierarchy。

### 4. 常用内置组件速查

| 组件 | 作用 |
|------|------|
| `Mesh Filter` + `Mesh Renderer` | 显示 3D 网格 |
| `Box/Sphere/Capsule Collider` | 碰撞体（物理形状） |
| `Rigidbody` | 受物理引擎控制（重力、力） |
| `CharacterController` | 角色专用碰撞控制（不受力，自管移动） |
| `Light` | 光源 |
| `Camera` | 摄像机 |
| `AudioSource` | 播放声音 |

### 5. 在脚本里访问组件与子物体

```csharp
using UnityEngine;

public class Demo : MonoBehaviour
{
    void Start()
    {
        // 1. 获取自身组件
        var rb = GetComponent<Rigidbody>();

        // 2. 获取子物体（按名字）
        Transform weapon = transform.Find("Weapon");
        if (weapon != null) Debug.Log("武器在：" + weapon.localPosition);

        // 3. 查找场景里任意对象（慎用，慢）
        GameObject light = GameObject.Find("Directional Light");

        // 4. 给自身加一个组件（运行时）
        gameObject.AddComponent<BoxCollider>();
    }
}
```

## 常见坑

1. **改了 Scale 但子物体不跟着变？** 其实会变——子物体继承父级缩放大小时「看起来」放大了。如果只想缩放外观不想影响子物体，应缩放 `Mesh` 本身或单独处理。
2. **SetParent 后位置跳变**：默认 `SetParent(parent, false)` 会保持世界坐标不变并改本地坐标；用 `SetParent(parent, true)` 会保持本地坐标（可能视觉跳一下）。按需求选。
3. **Instantiate 出来的物体没父级**：`Instantiate(prefab)` 会丢到场景根，记得 `SetParent`。
4. **组件找不到返回 null**：`GetComponentInChildren` 只找子级不包含自身，要包含自身用 `GetComponent`（自身）或确保层级正确。

## 小结

- 场景 = 对象树，GameObject 靠组件获得能力（组合优于继承）；
- Transform 决定位置/旋转/缩放，分本地与世界坐标；
- 父子关系让子物体跟随父物体，空物体是组织逻辑的好工具；
- 脚本里用 `GetComponent` / `transform.Find` / `SetParent` 操作；
- 下一章：用 C# 脚本给 GameObject 注入「行为」。
