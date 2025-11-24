import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
  IconButton,
  Tooltip,
  Modal,
  Button,
} from "@mui/material";
import { DeleteOutlined, EyeOutlined } from "@ant-design/icons";
import { message, Popconfirm } from "antd";
import styles from "./UserManagement.module.css";

export enum UserRole {
  ADMIN = "ADMIN",
  USER = "USER",
}

export enum UserGender {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER",
}

interface User {
  id: number;
  firstname: string;
  lastname: string;
  full_name: string;
  email: string;
  phone: string;
  gender: UserGender;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

const generateMockUsers = (): User[] => {
  const fixedUsers = [
    {
      id: 1,
      firstname: "Super",
      lastname: "Admin",
      full_name: "Super Admin",
      email: "admin@foodapp.com",
      phone: "+84901000001",
      gender: UserGender.MALE,
      role: UserRole.ADMIN,
      is_active: true,
      created_at: "2024-01-15T10:00:00Z",
      updated_at: "2025-11-01T08:20:00Z",
      deleted_at: null,
    },
    {
      id: 2,
      firstname: "John",
      lastname: "Doe",
      full_name: "John Doe",
      email: "john.doe@gmail.com",
      phone: "+84901234567",
      gender: UserGender.MALE,
      role: UserRole.USER,
      is_active: true,
      created_at: "2025-10-20T14:32:10Z",
      updated_at: "2025-11-20T09:15:22Z",
      deleted_at: null,
    },
    {
      id: 3,
      firstname: "Emma",
      lastname: "Watson",
      full_name: "Emma Watson",
      email: "emma.watson@example.com",
      phone: "+84912345678",
      gender: UserGender.FEMALE,
      role: UserRole.USER,
      is_active: false,
      created_at: "2025-09-10T08:20:00Z",
      updated_at: "2025-11-15T12:00:00Z",
      deleted_at: null,
    },
    {
      id: 4,
      firstname: "Michael",
      lastname: "Smith",
      full_name: "Michael Smith",
      email: "michael.smith@company.com",
      phone: "+84987654321",
      gender: UserGender.MALE,
      role: UserRole.ADMIN,
      is_active: true,
      created_at: "2025-08-01T11:45:00Z",
      updated_at: "2025-11-22T14:30:00Z",
      deleted_at: null,
    },
  ];

  const randomUsers = Array.from({ length: 46 }, (_, i) => ({
    id: 100 + i,
    firstname: `User${i + 100}`,
    lastname: `Last${i + 100}`,
    full_name: `User${i + 100} Last${i + 100}`,
    email: `user${i + 100}@example.com`,
    phone: `+84${Math.floor(900000000 + Math.random() * 99999999)}`,
    gender: [UserGender.MALE, UserGender.FEMALE, UserGender.OTHER][
      Math.floor(Math.random() * 3)
    ] as UserGender,
    role: Math.random() > 0.12 ? UserRole.USER : UserRole.ADMIN,
    is_active: Math.random() > 0.18,
    created_at: new Date(
      Date.now() - Math.floor(Math.random() * 120) * 24 * 60 * 60 * 1000
    ).toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  }));

  return [...fixedUsers, ...randomUsers].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
};

const formatDate = (isoString: string) => {
  return new Date(isoString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>(generateMockUsers());
  const [filteredUsers, setFilteredUsers] = useState<User[]>(users);
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [page, setPage] = useState(1);
  const itemsPerPage = 15;

  const currentAdminId = 1;

  const [openModal, setOpenModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    const filtered =
      roleFilter === "all"
        ? users.filter((u) => u.deleted_at === null)
        : users.filter((u) => u.role === roleFilter && u.deleted_at === null);

    setFilteredUsers(filtered);
    setPage(1);
  }, [roleFilter, users]);

  const paginatedUsers = filteredUsers.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const handleRoleFilterChange = (e: any) => {
    setRoleFilter(e.target.value as "all" | UserRole);
  };

  const handlePageChange = (_: any, value: number) => {
    setPage(value);
  };

  const handleDeleteUser = (userId: number) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, deleted_at: new Date().toISOString(), is_active: false }
          : u
      )
    );
    message.success("User deleted successfully!");
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedUser(null);
  };

  return (
    <Box className={styles.container}>
      <Typography variant="h4" className={styles.pageTitle}>
        USER MANAGEMENT
      </Typography>

      <Paper className={styles.filterBar}>
        <Box className={styles.filterLeft}>
          <FormControl size="small" className={styles.roleFilter}>
            <InputLabel>Role</InputLabel>
            <Select
              value={roleFilter}
              label="Role"
              onChange={handleRoleFilterChange}
            >
              <MenuItem value="all">All Users</MenuItem>
              <MenuItem value={UserRole.ADMIN}>Admin</MenuItem>
              <MenuItem value={UserRole.USER}>Customer</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Typography variant="body2" color="text.secondary" fontWeight="medium">
          Total: {filteredUsers.length} users
        </Typography>
      </Paper>

      <TableContainer component={Paper} className={styles.tableContainer}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell className={styles.tableHeader}>ID</TableCell>
              <TableCell className={styles.tableHeader}>Full Name</TableCell>
              <TableCell className={styles.tableHeader}>Email</TableCell>
              <TableCell className={styles.tableHeader}>Phone</TableCell>
              <TableCell className={styles.tableHeader}>Gender</TableCell>
              <TableCell className={styles.tableHeader}>Role</TableCell>
              <TableCell className={styles.tableHeader}>Status</TableCell>
              <TableCell className={styles.tableHeader}>Created At</TableCell>
              <TableCell className={styles.tableHeader} align="center">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedUsers.map((user) => (
              <TableRow key={user.id} hover className={styles.tableRow}>
                <TableCell>
                  <Typography fontWeight="bold">#{user.id}</Typography>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography fontWeight="medium">
                      {user.full_name}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.phone}</TableCell>
                <TableCell>
                  <Chip
                    label={
                      user.gender === "MALE"
                        ? "Male"
                        : user.gender === "FEMALE"
                        ? "Female"
                        : "Other"
                    }
                    size="small"
                    sx={{
                      fontWeight: "medium",
                      backgroundColor:
                        user.gender === "MALE"
                          ? "#e3f2fd"
                          : user.gender === "FEMALE"
                          ? "#fce4ec"
                          : undefined,
                      color:
                        user.gender === "MALE"
                          ? "#1976d2"
                          : user.gender === "FEMALE"
                          ? "#c2185b"
                          : undefined,
                      border:
                        user.gender === "OTHER" ? "1px solid #ddd" : "none",
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.role}
                    color={
                      user.role === UserRole.ADMIN ? "secondary" : "default"
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.is_active ? "Active" : "Inactive"}
                    color={user.is_active ? "success" : "error"}
                    size="small"
                  />
                </TableCell>
                <TableCell>{formatDate(user.created_at)}</TableCell>
                <TableCell align="center">
                  <Tooltip title="View details">
                    <IconButton
                      color="primary"
                      onClick={() => handleViewUser(user)}
                    >
                      <EyeOutlined />
                    </IconButton>
                  </Tooltip>
                  <Popconfirm
                    title="Delete this user?"
                    description="This action cannot be undone"
                    onConfirm={() => handleDeleteUser(user.id)}
                    okText="Delete"
                    cancelText="Cancel"
                    disabled={user.id === currentAdminId}
                  >
                    <Tooltip
                      title={
                        user.id === currentAdminId
                          ? "Cannot delete your own account"
                          : ""
                      }
                    >
                      <span>
                        <IconButton
                          color="error"
                          disabled={user.id === currentAdminId}
                        >
                          <DeleteOutlined />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Popconfirm>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {totalPages > 1 && (
        <Box className={styles.pagination}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            size="large"
          />
        </Box>
      )}

      <Modal
        open={openModal}
        onClose={handleCloseModal}
        aria-labelledby="user-detail-modal"
        aria-describedby="user-detail-description"
      >
        <Box className={styles.modalContainer}>
          {selectedUser && (
            <>
              <Typography variant="h6" className={styles.modalTitle}>
                User Details - #{selectedUser.id}
              </Typography>
              <Box className={styles.modalContent}>
                <Typography variant="body1">
                  <strong>Full Name:</strong> {selectedUser.full_name}
                </Typography>
                <Typography variant="body1">
                  <strong>First Name:</strong> {selectedUser.firstname}
                </Typography>
                <Typography variant="body1">
                  <strong>Last Name:</strong> {selectedUser.lastname}
                </Typography>
                <Typography variant="body1">
                  <strong>Email:</strong> {selectedUser.email}
                </Typography>
                <Typography variant="body1">
                  <strong>Phone:</strong> {selectedUser.phone}
                </Typography>
                <Typography variant="body1">
                  <strong>Gender:</strong>{" "}
                  {selectedUser.gender === "MALE"
                    ? "Male"
                    : selectedUser.gender === "FEMALE"
                    ? "Female"
                    : "Other"}
                </Typography>
                <Typography variant="body1">
                  <strong>Role:</strong> {selectedUser.role}
                </Typography>
                <Typography variant="body1">
                  <strong>Status:</strong>{" "}
                  {selectedUser.is_active ? "Active" : "Inactive"}
                </Typography>
                <Typography variant="body1">
                  <strong>Created At:</strong>{" "}
                  {formatDate(selectedUser.created_at)}
                </Typography>
                <Typography variant="body1">
                  <strong>Updated At:</strong>{" "}
                  {formatDate(selectedUser.updated_at)}
                </Typography>
              </Box>
              <Button
                variant="contained"
                color="primary"
                onClick={handleCloseModal}
                className={styles.modalCloseButton}
              >
                Close
              </Button>
            </>
          )}
        </Box>
      </Modal>
    </Box>
  );
};

export default UserManagement;
