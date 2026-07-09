import io
import shutil
from pathlib import Path

import streamlit as st

from agent.runner import stream_generation

st.set_page_config(
    page_title="Coder Buddy",
    page_icon="🤖",
    layout="wide",
)

st.title("Coder Buddy 🤖")
st.markdown("Enter a project idea and watch AI agents generate code in real time.")

if "session_output_dir" not in st.session_state:
    st.session_state.session_output_dir = None
if "files" not in st.session_state:
    st.session_state.files = []
if "generation_complete" not in st.session_state:
    st.session_state.generation_complete = False

user_prompt = st.text_area(
    "What do you want to build?",
    placeholder="e.g. Build a calculator in HTML, CSS, and JS",
    height=100,
)

col1, col2 = st.columns([1, 1])

status_placeholder = col1.empty()
file_tree_placeholder = col1.empty()
preview_placeholder = col2.empty()
download_placeholder = col2.empty()

if st.button("Generate", type="primary", disabled=not user_prompt.strip()):
    st.session_state.generation_complete = False
    st.session_state.files = []
    st.session_state.session_output_dir = None

    for event in stream_generation(user_prompt.strip()):
        if event["event"] == "start":
            st.session_state.session_output_dir = event["output_dir"]
            with status_placeholder.container():
                st.markdown("### Agent Status")
                st.info("🚀 Starting generation...")
            with file_tree_placeholder.container():
                st.markdown("### Files")
                st.text("Waiting for files...")
            with preview_placeholder.container():
                st.markdown("### Preview")
                st.text("Waiting for output...")

        elif event["event"] == "planner_done":
            plan = event.get("plan", {})
            with status_placeholder.container():
                st.markdown("### Agent Status")
                st.success("✅ **Planner** — Done")
                st.info(f"**Project:** {plan.get('name', 'N/A')}")
                st.info(f"**Stack:** {plan.get('techstack', 'N/A')}")
                st.info(f"**Files:** {len(plan.get('files', []))}")
                st.info("⏳ **Architect** — Running...")
                st.info("⏳ **Coder** — Pending")

        elif event["event"] == "architect_done":
            total = event.get("total_steps", 0)
            with status_placeholder.container():
                st.markdown("### Agent Status")
                st.success("✅ **Planner** — Done")
                st.success("✅ **Architect** — Done")
                st.info(f"📋 **Tasks:** {total}")
                st.info("⏳ **Coder** — Running...")

        elif event["event"] == "file_written":
            filepath = event.get("filepath", "")
            content = event.get("content", "")
            step = event.get("step", 0)
            total = event.get("total_steps", 0)
            task_desc = event.get("task_description", "")

            if filepath and filepath not in st.session_state.files:
                st.session_state.files.append(filepath)

            files_list = "\n".join(f"📄 {f}" for f in st.session_state.files) or "No files yet"

            with status_placeholder.container():
                st.markdown("### Agent Status")
                st.success("✅ **Planner** — Done")
                st.success("✅ **Architect** — Done")
                st.success(f"✅ **Coder** — Step {step}/{total}")
                st.info(f"📝 **Writing:** `{filepath}`")
                if task_desc:
                    st.caption(task_desc[:200])

            with file_tree_placeholder.container():
                st.markdown("### Files")
                st.code(files_list, language="")

            with preview_placeholder.container():
                st.markdown(f"### Preview: `{filepath}`")
                if content:
                    ext = Path(filepath).suffix
                    lang_map = {
                        ".py": "python",
                        ".js": "javascript",
                        ".ts": "typescript",
                        ".html": "html",
                        ".css": "css",
                        ".json": "json",
                        ".yaml": "yaml",
                        ".yml": "yaml",
                        ".md": "markdown",
                        ".sh": "bash",
                        ".sql": "sql",
                    }
                    lang = lang_map.get(ext)
                    st.code(content, language=lang or "text")
                else:
                    st.text("(empty file)")

        elif event["event"] == "generation_done":
            st.session_state.generation_complete = True
            with status_placeholder.container():
                st.markdown("### Agent Status")
                st.success("✅ **Planner** — Done")
                st.success("✅ **Architect** — Done")
                st.success("✅ **Coder** — Done")
                st.balloons()

            files_list = "\n".join(f"📄 {f}" for f in st.session_state.files) or "No files"
            with file_tree_placeholder.container():
                st.markdown("### Files")
                st.code(files_list, language="")

        elif event["event"] == "error":
            with status_placeholder.container():
                st.markdown("### Agent Status")
                st.error(f"❌ **Error:** {event.get('message', 'Unknown error')}")

    output_dir = st.session_state.session_output_dir
    if st.session_state.generation_complete and output_dir and Path(output_dir).exists():
        zip_buffer = io.BytesIO()
        shutil.make_archive(
            str(Path(output_dir).parent / "project"),
            "zip",
            root_dir=str(Path(output_dir).parent),
            base_dir=Path(output_dir).name,
        )
        zip_path = Path(output_dir).parent / "project.zip"
        if zip_path.exists():
            with open(zip_path, "rb") as f:
                zip_buffer = io.BytesIO(f.read())

        with download_placeholder.container():
            st.download_button(
                label="📦 Download ZIP",
                data=zip_buffer.getvalue(),
                file_name=f"coder_buddy_{Path(output_dir).name}.zip",
                mime="application/zip",
            )

else:
    with status_placeholder.container():
        st.markdown("### Agent Status")
        st.info("Enter a prompt and click **Generate** to start.")
    with file_tree_placeholder.container():
        st.markdown("### Files")
        st.text("No files yet")
    with preview_placeholder.container():
        st.markdown("### Preview")
        st.text("No output yet")

st.markdown("---")
st.caption("Powered by LangGraph + Groq")
