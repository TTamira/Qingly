#!/usr/bin/env python3
"""
青序工作台 · Python 测试能力强化训练目标树生成器

用法:
    python scripts/build_python_goal.py                     # 生成独立 JSON (仅含新方向片段)
    python scripts/build_python_goal.py -i export.json -o merged.json   # 合并到青序导出数据

层级映射:
    用户需求           →  青序 GOAL_LEVELS   字段
    ────────────────────────────────────────────────
    总目标             →  direction (方向)    stage / week
    阶段目标           →  goal (总目标)       deadline
    子目标             →  stage (阶段目标)     deadline + title 后缀标注状态
    具体任务           →  week (子目标)        title
"""

import json
import time
import argparse
import sys
from copy import deepcopy

# ────────────────────────────────────────────────────
# 原始数据（用户需求原文整理）
# ────────────────────────────────────────────────────

DIRECTION = {
    "title": "🐍 Python 测试能力强化训练",
    "stage": "验收标准：独立完成小型接口自动化测试项目 —— 需求分析 · 测试设计 · 脚本开发 · 运行调试 · 测试隔离 · 项目说明，并能解释关键设计决策",
    "week": "阶段 1 · 基础接口测试 → 阶段 2 · pytest 组织维护 → 阶段 3 · 独立项目实战",
}

PHASES = [
    # ─── 阶段 1 ───
    {
        "title": "阶段 1：独立编写基础接口测试脚本",
        "deadline": "6–8 周",
        "note": "验收：无完整示例情况下，独立编写基础测试函数 —— 正确发送请求、解析 JSON、设计断言，能定位修复常见脚本错误",
        "subs": [
            {
                "title": "子目标 1.1：掌握 Python 基础语法与断言 【已学·需巩固】",
                "deadline": "阶段 1",
                "tasks": [
                    "理解变量、函数定义、缩进和冒号的作用",
                    "掌握比较运算符与逻辑判断",
                    "使用 assert 校验数值、字符串和布尔条件",
                    "理解真值判断，区分 assert value 与 assert value is True",
                    "根据业务要求选择合适的断言表达式",
                    "独立完成基础断言练习",
                ],
            },
            {
                "title": "子目标 1.2：掌握字典、列表与嵌套 JSON 数据处理 【已学·需巩固】",
                "deadline": "阶段 1",
                "tasks": [
                    "区分字典与列表的结构和访问方式",
                    "根据字段名提取字典数据",
                    "访问多层嵌套 JSON 字段",
                    "使用 len() 判断列表长度",
                    "使用 in 判断列表成员是否存在",
                    "理解空列表、空字符串等值的真假判断",
                    "根据接口返回的数据结构编写断言",
                ],
            },
            {
                "title": "子目标 1.3：独立完成 API 请求与响应校验 【已学·需巩固】",
                "deadline": "阶段 1",
                "tasks": [
                    "导入 requests 并发送 GET 请求",
                    "理解 response 对象与 status_code",
                    "使用 response.json() 解析响应",
                    "串联请求、响应、数据提取和业务断言",
                    "校验 HTTP 状态码与业务返回码",
                    "校验关键字段、嵌套字段和列表数据",
                    "独立编写一个完整的基础接口测试函数",
                ],
            },
            {
                "title": "子目标 1.4：从业务需求设计测试点与断言 【待学习】",
                "deadline": "阶段 1",
                "tasks": [
                    "从需求描述中提取可验证的业务规则",
                    "区分 HTTP 层校验与业务层校验",
                    "为正常场景设计测试数据与预期结果",
                    "为异常场景设计测试数据与预期结果",
                    "识别空值、缺失字段和边界值等测试场景",
                    "为每个测试点选择对应断言",
                    "检查测试是否存在漏测与无效断言",
                ],
            },
            {
                "title": "子目标 1.5：定位与修复 Python 测试脚本错误 【持续训练】",
                "deadline": "阶段 1",
                "tasks": [
                    "识别语法错误、缩进错误和函数定义错误",
                    "识别模块导入错误与变量命名错误",
                    "定位字典键不存在和数据路径错误",
                    "区分数据类型错误与断言逻辑错误",
                    "根据报错信息定位问题发生的位置",
                    "修复代码后重新执行并验证结果",
                ],
            },
            {
                "title": "子目标 1.6：通过基础接口测试独立编写验收 【待验收】",
                "deadline": "阶段 1",
                "tasks": [
                    "根据一段接口需求独立提取测试点",
                    "不看示例代码，独立写出请求与响应处理",
                    "独立编写状态码、业务字段和列表断言",
                    "自行定位并修复至少一处脚本问题",
                    "说明每条断言验证的业务规则",
                    "完成综合练习并通过代码复核",
                ],
            },
        ],
    },

    # ─── 阶段 2 ───
    {
        "title": "阶段 2：使用 pytest 组织、复用和维护测试代码",
        "deadline": "阶段 1 通过后",
        "note": "验收：使用 pytest 组织多个接口测试用例，合理使用参数化和 fixture，定位失败原因；测试可重复运行、相互隔离、易于维护",
        "subs": [
            {
                "title": "子目标 2.1：掌握 pytest 的执行机制 【待学习】",
                "deadline": "阶段 2",
                "tasks": [
                    "理解 pytest 如何发现测试文件与测试函数",
                    "掌握测试执行命令及常用运行方式",
                    "理解 pytest 与 requests 各自的职责",
                    "阅读测试通过、失败与错误的输出信息",
                ],
            },
            {
                "title": "子目标 2.2：使用参数化提高用例复用率 【待学习】",
                "deadline": "阶段 2",
                "tasks": [
                    "理解 pytest.mark.parametrize 的作用",
                    "为同一接口设计多组输入和预期结果",
                    "区分测试数据、测试步骤和断言",
                    "分析参数化测试失败的具体数据组合",
                ],
            },
            {
                "title": "子目标 2.3：使用 fixture 管理测试前置条件 【待学习】",
                "deadline": "阶段 2",
                "tasks": [
                    "理解 fixture 的作用与调用方式",
                    "使用 fixture 复用请求或测试数据准备逻辑",
                    "掌握 fixture 的 yield 与清理逻辑",
                    "理解 fixture 作用域与执行次数",
                    "使用 conftest.py 组织公共 fixture",
                    "避免测试之间产生不必要的数据依赖",
                ],
            },
            {
                "title": "子目标 2.4：分析测试失败并维护测试质量 【待学习】",
                "deadline": "阶段 2",
                "tasks": [
                    "区分接口自身失败与测试脚本问题",
                    "从失败日志定位具体用例和断言",
                    "减少重复代码并提取公共逻辑",
                    "理解测试隔离、数据清理和重复执行",
                    "组织清晰的测试目录与模块",
                ],
            },
        ],
    },

    # ─── 阶段 3 ───
    {
        "title": "阶段 3：独立完成小型接口自动化测试项目",
        "deadline": "阶段 2 通过后",
        "note": "验收：独立完成小型接口自动化测试项目 —— 需求分析 · 测试设计 · 脚本开发 · 运行调试 · 测试隔离 · 项目说明，并能解释关键设计决策",
        "subs": [
            {
                "title": "子目标 3.1：分析接口需求并设计测试方案 【待学习】",
                "deadline": "阶段 3",
                "tasks": [
                    "阅读接口文档并梳理请求与响应结构",
                    "识别核心业务规则和异常处理规则",
                    "设计正常、异常和边界测试用例",
                    "确定每个用例的测试数据与预期结果",
                    "评估接口风险并确定测试优先级",
                ],
            },
            {
                "title": "子目标 3.2：设计自动化项目结构 【待学习】",
                "deadline": "阶段 3",
                "tasks": [
                    "划分测试用例、公共方法、配置与测试数据",
                    "建立清晰的项目目录结构",
                    "管理接口地址和环境配置",
                    "抽取公共请求逻辑并控制重复代码",
                    "明确测试数据的创建、使用与清理方式",
                ],
            },
            {
                "title": "子目标 3.3：实现并调试自动化测试项目 【待学习】",
                "deadline": "阶段 3",
                "tasks": [
                    "实现核心接口的自动化测试用例",
                    "通过 pytest 运行整组测试",
                    "处理脚本异常、接口异常与断言失败",
                    "检查用例覆盖率和重复测试问题",
                    "验证测试可重复运行且相互独立",
                ],
            },
            {
                "title": "子目标 3.4：完成项目验收与复盘 【待学习】",
                "deadline": "阶段 3",
                "tasks": [
                    "整理项目说明与运行步骤",
                    "记录测试范围、覆盖场景和已知限制",
                    "检查代码可读性与公共逻辑设计",
                    "复盘测试遗漏、调试过程与改进方向",
                    "形成可演示、可复现的项目成果",
                ],
            },
        ],
    },
]


# ────────────────────────────────────────────────────
# 构造青序格式的 goal 树
# ────────────────────────────────────────────────────

_counter = 0
_base_ts = int(time.time() * 1000)


def new_id() -> int:
    global _counter
    _counter += 1
    return _base_ts + _counter


def build_goal_tree() -> dict:
    """构造完整的 Python 训练方向节点（含所有子节点）"""

    # 3 goal → 14 stage → 78 week
    phase_nodes = []
    for phase in PHASES:
        stage_nodes = []
        for sub in phase["subs"]:
            week_nodes = [
                {"id": new_id(), "lv": "week", "title": task, "children": []}
                for task in sub["tasks"]
            ]
            stage_nodes.append({
                "id": new_id(),
                "lv": "stage",
                "title": sub["title"],
                "deadline": sub.get("deadline", ""),
                "children": week_nodes,
            })
        phase_nodes.append({
            "id": new_id(),
            "lv": "goal",
            "title": phase["title"],
            "deadline": phase.get("deadline", ""),
            "children": stage_nodes,
        })

    direction = {
        "id": new_id(),
        "lv": "direction",
        "title": DIRECTION["title"],
        "stage": DIRECTION["stage"],
        "week": DIRECTION["week"],
        "children": phase_nodes,
    }
    return direction


def count_nodes(node: dict) -> int:
    """递归统计节点数"""
    return 1 + sum(count_nodes(c) for c in (node.get("children") or []))


# ────────────────────────────────────────────────────
# 合并到青序导出数据
# ────────────────────────────────────────────────────

def merge_into_export(export_path: str, output_path: str) -> None:
    """
    读取青序导出的 JSON（包含 data.goal 数组），
    往数组末尾追加新方向节点，输出合并后的 JSON。
    """
    with open(export_path, "r", encoding="utf-8") as f:
        export = json.load(f)

    direction = build_goal_tree()

    # 青序导出文件可能是两种格式：
    # a) 完整 data 结构：{ "goal": [...], "todo": [...], ... }
    # b) 纯 goal 数组：[...]
    if isinstance(export, dict) and "goal" in export:
        export["goal"] = export.get("goal", []) + [direction]
        out = export
    elif isinstance(export, list):
        out = export + [direction]
    else:
        # 兜底：包装成 { "goal": [...] }
        out = {"goal": [direction]}

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)

    print(f"✓ 合并完成 → {output_path}")
    print(f"  新增方向节点: {count_nodes(direction)} 个 (direction→goal→stage→week)")
    print(f"  原有方向数:   {len(export.get('goal', [])) if isinstance(export, dict) else len(export)}")


def standalone_output(output_path: str) -> None:
    """生成独立 JSON（仅含新方向片段，用户可手动复制）"""
    direction = build_goal_tree()
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump([direction], f, ensure_ascii=False, indent=2)
    print(f"✓ 独立输出 → {output_path}")
    print(f"  包含节点: {count_nodes(direction)} 个")
    _print_summary(direction)


def _print_summary(direction: dict) -> None:
    """打印结构概览"""
    goals = direction["children"]
    print(f"\n📂 {direction['title']}")
    print(f"   ├── 阶段 1: {len(goals[0]['children'])} 个子目标, "
          f"{sum(len(s['children']) for s in goals[0]['children'])} 条任务")
    print(f"   ├── 阶段 2: {len(goals[1]['children'])} 个子目标, "
          f"{sum(len(s['children']) for s in goals[1]['children'])} 条任务")
    print(f"   └── 阶段 3: {len(goals[2]['children'])} 个子目标, "
          f"{sum(len(s['children']) for s in goals[2]['children'])} 条任务")


# ────────────────────────────────────────────────────
# CLI 入口
# ────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="青序工作台 · Python 测试训练目标树生成器",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  python scripts/build_python_goal.py                              # 独立输出 python_goal_tree.json
  python scripts/build_python_goal.py -i export.json -o new.json   # 合并到青序导出数据
        """,
    )
    parser.add_argument("-i", "--input", help="青序导出的 JSON 文件路径")
    parser.add_argument("-o", "--output", help="输出文件路径")
    args = parser.parse_args()

    if args.input:
        out = args.output or "merged_export.json"
        merge_into_export(args.input, out)
    else:
        out = args.output or "python_goal_tree.json"
        standalone_output(out)


if __name__ == "__main__":
    main()
