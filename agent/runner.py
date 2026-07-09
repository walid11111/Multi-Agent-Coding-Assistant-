import uuid
from pathlib import Path

from agent.graph import agent
from agent import tools


def stream_generation(user_prompt: str, output_dir: str | None = None):
    session_id = str(uuid.uuid4())[:8]
    base_dir = Path(output_dir) if output_dir else Path.cwd() / "generated_project"
    session_dir = base_dir / session_id
    session_dir.mkdir(parents=True, exist_ok=True)

    original_root = tools.PROJECT_ROOT
    tools.set_project_root(str(session_dir))

    try:
        yield {
            "event": "start",
            "session_id": session_id,
            "output_dir": str(session_dir),
        }

        for stream_event in agent.stream(
            {"user_prompt": user_prompt},
            {"recursion_limit": 100},
        ):
            for node_name, state_update in stream_event.items():
                if node_name == "planner":
                    plan = state_update.get("plan")
                    yield {
                        "event": "planner_done",
                        "plan": plan.model_dump() if plan else None,
                    }

                elif node_name == "architect":
                    task_plan = state_update.get("task_plan")
                    steps = task_plan.implementation_steps if task_plan else []
                    yield {
                        "event": "architect_done",
                        "task_plan": task_plan.model_dump() if task_plan else None,
                        "total_steps": len(steps),
                    }

                elif node_name == "coder":
                    status = state_update.get("status")
                    if status == "DONE":
                        yield {
                            "event": "generation_done",
                            "message": "All files generated successfully",
                        }
                    else:
                        filepath = state_update.get("current_filepath")
                        content = state_update.get("current_content")
                        task_desc = state_update.get("current_task")
                        cs = state_update.get("coder_state")
                        step = cs.current_step_idx if cs else 0
                        total = len(cs.task_plan.implementation_steps) if cs and cs.task_plan else 0

                        yield {
                            "event": "file_written",
                            "filepath": filepath,
                            "content": content or "",
                            "task_description": task_desc or "",
                            "step": step,
                            "total_steps": total,
                        }

    except Exception as e:
        yield {
            "event": "error",
            "message": str(e),
        }
    finally:
        tools.set_project_root(str(original_root))
