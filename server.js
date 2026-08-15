const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

// ==============================
// MIDDLEWARE
// ==============================

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

// ==============================
// MONGODB CONNECTION
// ==============================

mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("MongoDB connected successfully");
    })
    .catch((error) => {
        console.log("MongoDB connection failed");
        console.log(error.message);
    });

// ==============================
// USER SCHEMA
// ==============================

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
);

const User = mongoose.model("User", userSchema);

// ==============================
// TASK SCHEMA
// ==============================

const taskSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        title: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            default: ""
        },

        dueDate: {
            type: Date,
            required: true
        },

        priority: {
            type: String,
            enum: ["Low", "Medium", "High"],
            default: "Medium"
        },

        status: {
            type: String,
            enum: ["Pending", "In Progress", "Completed"],
            default: "Pending"
        }
    },
    {
        timestamps: true
    }
);

const Task = mongoose.model("Task", taskSchema);

// ==============================
// AUTHENTICATION MIDDLEWARE
// ==============================

function authenticateToken(req, res, next) {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            message: "Please login first."
        });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            message: "Invalid token."
        });
    }

    try {

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = decoded;

        next();

    } catch (error) {

        return res.status(401).json({
            message: "Session expired. Please login again."
        });
    }
}

// ==============================
// HOME PAGE
// ==============================

// ==============================
// HOME PAGE
// ==============================

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ==============================
// REGISTER
// ==============================

app.post("/api/register", async (req, res) => {

    try {

        const {
            name,
            email,
            password
        } = req.body;

        if (!name || !email || !password) {

            return res.status(400).json({
                message: "Please fill all fields."
            });

        }

        if (password.length < 6) {

            return res.status(400).json({
                message:
                    "Password must contain at least 6 characters."
            });

        }

        const existingUser =
            await User.findOne({
                email: email.toLowerCase()
            });

        if (existingUser) {

            return res.status(400).json({
                message:
                    "An account with this email already exists."
            });

        }

        const hashedPassword =
            await bcrypt.hash(
                password,
                10
            );

        const user = new User({
            name: name,
            email: email.toLowerCase(),
            password: hashedPassword
        });

        await user.save();

        res.status(201).json({
            message:
                "Account created successfully."
        });

    } catch (error) {

        console.log(
            "Registration error:",
            error
        );

        res.status(500).json({
            message:
                "Server error during registration."
        });

    }

});

// ==============================
// LOGIN
// ==============================

app.post("/api/login", async (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;

        if (!email || !password) {

            return res.status(400).json({
                message:
                    "Please enter email and password."
            });

        }

        const user =
            await User.findOne({
                email: email.toLowerCase()
            });

        if (!user) {

            return res.status(401).json({
                message:
                    "Invalid email or password."
            });

        }

        const passwordMatch =
            await bcrypt.compare(
                password,
                user.password
            );

        if (!passwordMatch) {

            return res.status(401).json({
                message:
                    "Invalid email or password."
            });

        }

        const token =
            jwt.sign(
                {
                    userId: user._id,
                    name: user.name,
                    email: user.email
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: "7d"
                }
            );

        res.json({

            message:
                "Login successful.",

            token: token,

            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }

        });

    } catch (error) {

        console.log(
            "Login error:",
            error
        );

        res.status(500).json({
            message:
                "Server error during login."
        });

    }

});

// ==============================
// GET USER
// ==============================

app.get(
    "/api/user",
    authenticateToken,
    async (req, res) => {

        try {

            const user =
                await User.findById(
                    req.user.userId
                ).select("-password");

            if (!user) {

                return res.status(404).json({
                    message:
                        "User not found."
                });

            }

            res.json(user);

        } catch (error) {

            res.status(500).json({
                message:
                    "Unable to load user."
            });

        }

    }
);

// ==============================
// GET TASKS
// ==============================

app.get(
    "/api/tasks",
    authenticateToken,
    async (req, res) => {

        try {

            const tasks =
                await Task.find({
                    userId: req.user.userId
                }).sort({
                    dueDate: 1
                });

            res.json(tasks);

        } catch (error) {

            console.log(error);

            res.status(500).json({
                message:
                    "Unable to load tasks."
            });

        }

    }
);

// ==============================
// CREATE TASK
// ==============================

app.post(
    "/api/tasks",
    authenticateToken,
    async (req, res) => {

        try {

            const {
                title,
                description,
                dueDate,
                priority,
                status
            } = req.body;

            if (!title || !dueDate) {

                return res.status(400).json({
                    message:
                        "Title and due date are required."
                });

            }

            const task = new Task({

                userId:
                    req.user.userId,

                title:
                    title.trim(),

                description:
                    description || "",

                dueDate:
                    dueDate,

                priority:
                    priority || "Medium",

                status:
                    status || "Pending"

            });

            await task.save();

            res.status(201).json({

                message:
                    "Task created successfully.",

                task:
                    task

            });

        } catch (error) {

            console.log(error);

            res.status(500).json({
                message:
                    "Unable to create task."
            });

        }

    }
);

// ==============================
// UPDATE TASK
// ==============================

app.put(
    "/api/tasks/:id",
    authenticateToken,
    async (req, res) => {

        try {

            const task =
                await Task.findOne({
                    _id: req.params.id,
                    userId: req.user.userId
                });

            if (!task) {

                return res.status(404).json({
                    message:
                        "Task not found."
                });

            }

            const {
                title,
                description,
                dueDate,
                priority,
                status
            } = req.body;

            if (title !== undefined) {
                task.title =
                    title.trim();
            }

            if (description !== undefined) {
                task.description =
                    description;
            }

            if (dueDate !== undefined) {
                task.dueDate =
                    dueDate;
            }

            if (priority !== undefined) {
                task.priority =
                    priority;
            }

            if (status !== undefined) {
                task.status =
                    status;
            }

            await task.save();

            res.json({

                message:
                    "Task updated successfully.",

                task:
                    task

            });

        } catch (error) {

            console.log(error);

            res.status(500).json({
                message:
                    "Unable to update task."
            });

        }

    }
);

// ==============================
// DELETE TASK
// ==============================

app.delete(
    "/api/tasks/:id",
    authenticateToken,
    async (req, res) => {

        try {

            const task =
                await Task.findOneAndDelete({
                    _id: req.params.id,
                    userId: req.user.userId
                });

            if (!task) {

                return res.status(404).json({
                    message:
                        "Task not found."
                });

            }

            res.json({
                message:
                    "Task deleted successfully."
            });

        } catch (error) {

            console.log(error);

            res.status(500).json({
                message:
                    "Unable to delete task."
            });

        }

    }
);

// ==============================
// COMPLETE TASK
// ==============================

app.patch(
    "/api/tasks/:id/complete",
    authenticateToken,
    async (req, res) => {

        try {

            const task =
                await Task.findOne({
                    _id: req.params.id,
                    userId: req.user.userId
                });

            if (!task) {

                return res.status(404).json({
                    message:
                        "Task not found."
                });

            }

            task.status =
                "Completed";

            await task.save();

            res.json({

                message:
                    "Task completed successfully.",

                task:
                    task

            });

        } catch (error) {

            console.log(error);

            res.status(500).json({
                message:
                    "Unable to complete task."
            });

        }

    }
);

// ==============================
// STATISTICS
// ==============================

app.get(
    "/api/tasks/stats",
    authenticateToken,
    async (req, res) => {

        try {

            const tasks =
                await Task.find({
                    userId:
                        req.user.userId
                });

            const total =
                tasks.length;

            const pending =
                tasks.filter(
                    task =>
                        task.status ===
                        "Pending"
                ).length;

            const inProgress =
                tasks.filter(
                    task =>
                        task.status ===
                        "In Progress"
                ).length;

            const completed =
                tasks.filter(
                    task =>
                        task.status ===
                        "Completed"
                ).length;

            res.json({

                total,
                pending,
                inProgress,
                completed

            });

        } catch (error) {

            res.status(500).json({
                message:
                    "Unable to load statistics."
            });

        }

    }
);

// ==============================
// START SERVER
// ==============================

app.listen(
    PORT,
    () => {

        console.log(
            `Server running at http://localhost:${PORT}`
        );

    }
);