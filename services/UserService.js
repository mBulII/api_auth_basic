import db from "../dist/db/models/index.js";
import bcrypt from "bcrypt";
import { Op } from "sequelize";

export const createUser = async (req) => {
  const { name, email, password, password_second, cellphone } = req.body;
  if (password !== password_second) {
    return {
      code: 400,
      message: "Passwords do not match",
    };
  }
  const user = await db.User.findOne({
    where: {
      email: email,
    },
  });
  if (user) {
    return {
      code: 400,
      message: "User already exists",
    };
  }

  const encryptedPassword = await bcrypt.hash(password, 10);

  const newUser = await db.User.create({
    name,
    email,
    password: encryptedPassword,
    cellphone,
    status: true,
  });
  return {
    code: 200,
    message: "User created successfully with ID: " + newUser.id,
  };
};

export const bulkCreateUsers = async (users) => {
  let createdCount = 0;
  let failedCount = 0;

  for (const user of users) {
    const { name, email, password, password_second, cellphone } = user;
    if (password !== password_second) {
      failedCount++;
      continue;
    }

    const existingUser = await db.User.findOne({
      where: { email },
    });
    if (existingUser) {
      failedCount++;
      continue;
    }

    const encryptedPassword = await bcrypt.hash(password, 10);

    try {
      await db.User.create({
        name,
        email,
        password: encryptedPassword,
        cellphone,
        status: true,
      });
      createdCount++;
    } catch (error) {
      failedCount++;
    }
  }

  return {
    code: 200,
    message: {
      created: createdCount,
      failed: failedCount,
    },
  };
};

export const getFilteredUsers = async (filters) => {
  const { status, name, loggedInBefore, loggedInAfter } = filters;
  const whereClause = {};

  if (status) {
    if (status !== "true" && status !== "false") {
      return {
        code: 400,
        message: "Invalid status value. Only 'true' or 'false' are allowed.",
      };
    }
    whereClause.status = status === "true";
  }

  if (name) {
    whereClause.name = {
      [Op.like]: `%${name}%`,
    };
  }

  const sessionWhereClause = {};
  if (loggedInBefore) {
    const beforeDate = new Date(loggedInBefore);
    if (isNaN(beforeDate.getTime())) {
      return {
        code: 400,
        message: "Invalid date format for 'loggedInBefore'",
      };
    }
    sessionWhereClause.createdAt = {
      ...sessionWhereClause.createdAt,
      [Op.lte]: beforeDate,
    };
  }

  if (loggedInAfter) {
    const afterDate = new Date(loggedInAfter);
    if (isNaN(afterDate.getTime())) {
      return {
        code: 400,
        message: "Invalid date format for 'loggedInAfter'",
      };
    }
    sessionWhereClause.createdAt = {
      ...sessionWhereClause.createdAt,
      [Op.gte]: afterDate,
    };
  }

  const sessionInclude = {
    model: db.Session,
    as: "sessions",
    required: false,
    attributes: ["createdAt"],
  };
  if (loggedInBefore || loggedInAfter) {
    sessionInclude.where = sessionWhereClause;
  }

  const users = await db.User.findAll({
    where: whereClause,
    attributes: ["id", "name", "email", "cellphone"],
    include: [sessionInclude],
  });
  let filteredUsers = users;
  if (loggedInBefore || loggedInAfter) {
    filteredUsers = users.filter((user) => user.sessions.length > 0);
  }

  return {
    code: 200,
    message: filteredUsers,
  };
};

export const getAllActiveUsers = async () => {
  return {
    code: 200,
    message: await db.User.findAll({
      where: { status: true },
      attributes: ["id", "name", "email", "cellphone"],
    }),
  };
};

export const getUserById = async (id) => {
  return {
    code: 200,
    message: await db.User.findOne({
      where: {
        id: id,
        status: true,
      },
    }),
  };
};

export const updateUser = async (req) => {
  const user = db.User.findOne({
    where: {
      id: req.params.id,
      status: true,
    },
  });
  const payload = {};
  payload.name = req.body.name ?? user.name;
  payload.password = req.body.password
    ? await bcrypt.hash(req.body.password, 10)
    : user.password;
  payload.cellphone = req.body.cellphone ?? user.cellphone;
  await db.User.update(payload, {
    where: {
      id: req.params.id,
    },
  });
  return {
    code: 200,
    message: "User updated successfully",
  };
};

export const deleteUser = async (id) => {
  const user = db.User.findOne({
    where: {
      id: id,
      status: true,
    },
  });
  await db.User.update(
    {
      status: false,
    },
    {
      where: {
        id: id,
      },
    }
  );
  return {
    code: 200,
    message: "User deleted successfully",
  };
};
