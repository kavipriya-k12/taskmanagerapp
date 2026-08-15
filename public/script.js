const API = "/api";


// =====================================================
// LOGIN
// =====================================================

const loginForm =
    document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const email =
                document.getElementById(
                    "loginEmail"
                ).value.trim();

            const password =
                document.getElementById(
                    "loginPassword"
                ).value;

            const message =
                document.getElementById(
                    "loginMessage"
                );

            message.textContent =
                "Logging in...";

            message.className =
                "message";


            try {

                const response =
                    await fetch(
                        `${API}/login`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({
                                    email,
                                    password
                                })
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        data.message
                    );

                }


                localStorage.setItem(
                    "token",
                    data.token
                );


                localStorage.setItem(
                    "user",
                    JSON.stringify(
                        data.user
                    )
                );


                message.textContent =
                    "Login successful!";


                message.className =
                    "message success";


                setTimeout(
                    function () {

                        window.location.href =
                            "dashboard.html";

                    },
                    500
                );


            } catch (error) {

                message.textContent =
                    error.message;

                message.className =
                    "message error";

            }

        }
    );

}


// =====================================================
// REGISTER
// =====================================================

const registerForm =
    document.getElementById(
        "registerForm"
    );


if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const name =
                document.getElementById(
                    "registerName"
                ).value.trim();


            const email =
                document.getElementById(
                    "registerEmail"
                ).value.trim();


            const password =
                document.getElementById(
                    "registerPassword"
                ).value;


            const message =
                document.getElementById(
                    "registerMessage"
                );


            message.textContent =
                "Creating account...";


            try {

                const response =
                    await fetch(
                        `${API}/register`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({
                                    name,
                                    email,
                                    password
                                })
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        data.message
                    );

                }


                message.textContent =
                    "Account created successfully!";

                message.className =
                    "message success";


                setTimeout(
                    function () {

                        window.location.href =
                            "index.html";

                    },
                    1200
                );


            } catch (error) {

                message.textContent =
                    error.message;

                message.className =
                    "message error";

            }

        }
    );

}


// =====================================================
// DASHBOARD
// =====================================================

const tasksContainer =
    document.getElementById(
        "tasksContainer"
    );


if (tasksContainer) {

    startDashboard();

}


async function startDashboard() {

    const token =
        localStorage.getItem(
            "token"
        );


    if (!token) {

        window.location.href =
            "index.html";

        return;

    }


    await loadUser();

    await loadTasks();

    await loadStats();

}


// =====================================================
// AUTH HEADERS
// =====================================================

function getHeaders() {

    const token =
        localStorage.getItem(
            "token"
        );


    return {

        "Content-Type":
            "application/json",

        "Authorization":
            `Bearer ${token}`

    };

}


// =====================================================
// LOAD USER
// =====================================================

async function loadUser() {

    try {

        const response =
            await fetch(
                `${API}/user`,
                {
                    headers:
                        getHeaders()
                }
            );


        if (!response.ok) {

            logout();

            return;

        }


        const user =
            await response.json();


        document.getElementById(
            "userName"
        ).textContent =
            user.name;


        document.getElementById(
            "userEmail"
        ).textContent =
            user.email;


        document.getElementById(
            "welcomeName"
        ).textContent =
            user.name;


    } catch (error) {

        console.log(error);

    }

}


// =====================================================
// LOAD TASKS
// =====================================================

let allTasks = [];


async function loadTasks() {

    try {

        const response =
            await fetch(
                `${API}/tasks`,
                {
                    headers:
                        getHeaders()
                }
            );


        if (!response.ok) {

            if (response.status === 401) {

                logout();

                return;

            }

            throw new Error(
                "Unable to load tasks."
            );

        }


        allTasks =
            await response.json();


        displayTasks(
            allTasks
        );


    } catch (error) {

        console.log(error);

    }

}


// =====================================================
// DISPLAY TASKS
// =====================================================

function displayTasks(tasks) {

    const container =
        document.getElementById(
            "tasksContainer"
        );


    const empty =
        document.getElementById(
            "emptyState"
        );


    container.innerHTML = "";


    if (tasks.length === 0) {

        empty.style.display =
            "block";

        return;

    }


    empty.style.display =
        "none";


    tasks.forEach(
        function (task, index) {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "task-card";


            const days =
                getDaysLeft(
                    task.dueDate
                );


            let daysText;


            if (
                task.status ===
                "Completed"
            ) {

                daysText =
                    "Completed";

            } else if (days < 0) {

                daysText =
                    "Overdue";

            } else if (days === 0) {

                daysText =
                    "Due Today";

            } else {

                daysText =
                    `${days} Days Left`;

            }


            const statusClass =
                task.status
                    .toLowerCase()
                    .replace(
                        " ",
                        "-"
                    );


            const priorityClass =
                task.priority
                    .toLowerCase();


            card.innerHTML = `

                <div class="task-card-top">

                    <span class="task-number">
                        ${index + 1}
                    </span>

                    <span class="task-status ${statusClass}">
                        ${escapeHTML(
                            task.status
                        )}
                    </span>

                </div>


                <h3 class="task-title">
                    ${escapeHTML(
                        task.title
                    )}
                </h3>


                <p class="task-description">
                    ${escapeHTML(
                        task.description ||
                        "No description provided."
                    )}
                </p>


                <div class="task-details">

                    <div class="detail">

                        <span>
                            📅
                        </span>

                        <div>

                            <small>
                                Due Date
                            </small>

                            <strong>
                                ${formatDate(
                                    task.dueDate
                                )}
                            </strong>

                        </div>

                    </div>


                    <div class="detail">

                        <span>
                            🎯
                        </span>

                        <div>

                            <small>
                                Priority
                            </small>

                            <strong
                                class="priority-${priorityClass}"
                            >
                                ${task.priority}
                            </strong>

                        </div>

                    </div>


                    <div class="detail">

                        <span>
                            ⏰
                        </span>

                        <div>

                            <small>
                                Deadline
                            </small>

                            <strong
                                class="${
                                    days < 0
                                        ? "overdue"
                                        : ""
                                }"
                            >
                                ${daysText}
                            </strong>

                        </div>

                    </div>

                </div>


                <div class="task-actions">

                    ${
                        task.status !==
                        "Completed"
                            ? `
                            <button
                                class="complete-btn"
                                onclick="completeTask('${task._id}')"
                            >
                                ✓ Complete
                            </button>
                            `
                            : ""
                    }


                    <button
                        class="edit-btn"
                        onclick="editTask('${task._id}')"
                    >
                        ✏ Edit
                    </button>


                    <button
                        class="delete-btn"
                        onclick="deleteTask('${task._id}')"
                    >
                        🗑 Delete
                    </button>

                </div>

            `;


            container.appendChild(
                card
            );

        }
    );

}


// =====================================================
// LOAD STATISTICS
// =====================================================

async function loadStats() {

    try {

        const response =
            await fetch(
                `${API}/tasks/stats`,
                {
                    headers:
                        getHeaders()
                }
            );


        if (!response.ok) {

            return;

        }


        const stats =
            await response.json();


        document.getElementById(
            "totalTasks"
        ).textContent =
            stats.total;


        document.getElementById(
            "pendingTasks"
        ).textContent =
            stats.pending;


        document.getElementById(
            "progressTasks"
        ).textContent =
            stats.inProgress;


        document.getElementById(
            "completedTasks"
        ).textContent =
            stats.completed;


    } catch (error) {

        console.log(error);

    }

}


// =====================================================
// OPEN MODAL
// =====================================================

const addTaskBtn =
    document.getElementById(
        "addTaskBtn"
    );


if (addTaskBtn) {

    addTaskBtn.addEventListener(
        "click",
        function () {

            openModal();

        }
    );

}


const emptyAddBtn =
    document.getElementById(
        "emptyAddBtn"
    );


if (emptyAddBtn) {

    emptyAddBtn.addEventListener(
        "click",
        function () {

            openModal();

        }
    );

}


// =====================================================
// MODAL
// =====================================================

function openModal(task = null) {

    const modal =
        document.getElementById(
            "taskModal"
        );


    modal.classList.add(
        "show"
    );


    if (task) {

        document.getElementById(
            "modalTitle"
        ).textContent =
            "Edit Task";


        document.getElementById(
            "taskId"
        ).value =
            task._id;


        document.getElementById(
            "taskTitle"
        ).value =
            task.title;


        document.getElementById(
            "taskDescription"
        ).value =
            task.description || "";


        document.getElementById(
            "taskDueDate"
        ).value =
            task.dueDate
                .split("T")[0];


        document.getElementById(
            "taskPriority"
        ).value =
            task.priority;


        document.getElementById(
            "taskStatus"
        ).value =
            task.status;


    } else {

        document.getElementById(
            "modalTitle"
        ).textContent =
            "Create New Task";


        document.getElementById(
            "taskForm"
        ).reset();


        document.getElementById(
            "taskId"
        ).value =
            "";

    }

}


function closeModal() {

    document.getElementById(
        "taskModal"
    ).classList.remove(
        "show"
    );

}


const closeModalBtn =
    document.getElementById(
        "closeModal"
    );


if (closeModalBtn) {

    closeModalBtn.addEventListener(
        "click",
        closeModal
    );

}


// =====================================================
// SAVE TASK
// =====================================================

const taskForm =
    document.getElementById(
        "taskForm"
    );


if (taskForm) {

    taskForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const taskId =
                document.getElementById(
                    "taskId"
                ).value;


            const taskData = {

                title:
                    document.getElementById(
                        "taskTitle"
                    ).value.trim(),

                description:
                    document.getElementById(
                        "taskDescription"
                    ).value.trim(),

                dueDate:
                    document.getElementById(
                        "taskDueDate"
                    ).value,

                priority:
                    document.getElementById(
                        "taskPriority"
                    ).value,

                status:
                    document.getElementById(
                        "taskStatus"
                    ).value

            };


            try {

                const url =
                    taskId
                        ? `${API}/tasks/${taskId}`
                        : `${API}/tasks`;


                const method =
                    taskId
                        ? "PUT"
                        : "POST";


                const response =
                    await fetch(
                        url,
                        {
                            method:
                                method,

                            headers:
                                getHeaders(),

                            body:
                                JSON.stringify(
                                    taskData
                                )
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        data.message
                    );

                }


                closeModal();

                await loadTasks();

                await loadStats();


            } catch (error) {

                alert(
                    error.message
                );

            }

        }
    );

}


// =====================================================
// EDIT TASK
// =====================================================

function editTask(id) {

    const task =
        allTasks.find(
            function (item) {

                return item._id === id;

            }
        );


    if (task) {

        openModal(task);

    }

}


// =====================================================
// DELETE TASK
// =====================================================

async function deleteTask(id) {

    const answer =
        confirm(
            "Are you sure you want to delete this task?"
        );


    if (!answer) {

        return;

    }


    try {

        const response =
            await fetch(
                `${API}/tasks/${id}`,
                {
                    method:
                        "DELETE",

                    headers:
                        getHeaders()
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message
            );

        }


        await loadTasks();

        await loadStats();


    } catch (error) {

        alert(
            error.message
        );

    }

}


// =====================================================
// COMPLETE TASK
// =====================================================

async function completeTask(id) {

    try {

        const response =
            await fetch(
                `${API}/tasks/${id}/complete`,
                {
                    method:
                        "PATCH",

                    headers:
                        getHeaders()
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message
            );

        }


        await loadTasks();

        await loadStats();


    } catch (error) {

        alert(
            error.message
        );

    }

}


// =====================================================
// FILTER TASKS
// =====================================================

const filterTasks =
    document.getElementById(
        "filterTasks"
    );


if (filterTasks) {

    filterTasks.addEventListener(
        "change",
        function () {

            const value =
                this.value;


            if (value === "All") {

                displayTasks(
                    allTasks
                );

                return;

            }


            const filtered =
                allTasks.filter(
                    function (task) {

                        return (
                            task.status ===
                            value
                        );

                    }
                );


            displayTasks(
                filtered
            );

        }
    );

}


// =====================================================
// LOGOUT
// =====================================================

const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );


if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        logout
    );

}


function logout() {

    localStorage.removeItem(
        "token"
    );

    localStorage.removeItem(
        "user"
    );


    window.location.href =
        "index.html";

}


// =====================================================
// DATE
// =====================================================

function formatDate(date) {

    return new Date(
        date
    ).toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


// =====================================================
// DAYS LEFT
// =====================================================

function getDaysLeft(date) {

    const today =
        new Date();


    today.setHours(
        0,
        0,
        0,
        0
    );


    const due =
        new Date(date);


    due.setHours(
        0,
        0,
        0,
        0
    );


    const difference =
        due.getTime() -
        today.getTime();


    return Math.ceil(
        difference /
        (1000 * 60 * 60 * 24)
    );

}


// =====================================================
// SECURITY
// =====================================================

function escapeHTML(text) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        text;


    return div.innerHTML;

}


// =====================================================
// CLOSE MODAL WHEN CLICKING OUTSIDE
// =====================================================

const modal =
    document.getElementById(
        "taskModal"
    );


if (modal) {

    modal.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                modal
            ) {

                closeModal();

            }

        }
    );

}