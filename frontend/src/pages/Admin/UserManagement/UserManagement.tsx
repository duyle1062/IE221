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
  CircularProgress,
  Alert,
} from "@mui/material";
import { DeleteOutlined, EyeOutlined } from "@ant-design/icons";
import { message, Popconfirm } from "antd";
import styles from "./UserManagement.module.css";
import adminUserService, {
  AdminUser,
  UserRole,
  UserGender,
} from "../../../services/adminUser.service";
import { useAuth } from "../../../context/AuthContext";

const formatDate = (isoString: string | null) => {
  if (!isoString) return "Never";
  return new Date(isoString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 15;

  const [openModal, setOpenModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await adminUserService.getUserList({
        role: roleFilter,
        page: page,
        page_size: itemsPerPage,
      });

      setUsers(response.results || []);
      setTotalCount(response.count || 0);
    } catch (err: any) {
      console.error("Error fetching users:", err);
      setError(err?.detail || "Failed to load users. Please try again.");
      message.error("Failed to load users");
      setUsers([]); // Set empty array on error
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Load users on component mount and when filters change
  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter, page]);

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const handleRoleFilterChange = (e: any) => {
    setRoleFilter(e.target.value as "all" | UserRole);
    setPage(1); // Reset to first page when filter changes
  };

  const handlePageChange = (_: any, value: number) => {
    setPage(value);
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      await adminUserService.deleteUser(userId);
      message.success("User deleted successfully!");

      // Refresh the user list after deletion
      await fetchUsers();
    } catch (err: any) {
      console.error("Error deleting user:", err);
      message.error(err?.detail || "Failed to delete user");
    }
  };

  const handleViewUser = async (user: AdminUser) => {
    try {
      setLoadingDetail(true);
      setOpenModal(true);

      // Fetch detailed user information
      const detailedUser = await adminUserService.getUserDetail(user.id);
      setSelectedUser(detailedUser);
    } catch (err: any) {
      console.error("Error fetching user detail:", err);
      message.error("Failed to load user details");
      setOpenModal(false);
    } finally {
      setLoadingDetail(false);
    }
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

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper className={styles.filterBar}>
        <Box className={styles.filterLeft}>
          <FormControl size="small" className={styles.roleFilter}>
            <InputLabel>Role</InputLabel>
            <Select
              value={roleFilter}
              label="Role"
              onChange={handleRoleFilterChange}
              disabled={loading}
              MenuProps={{
                PaperProps: {
                  sx: {
                    borderRadius: "16px",
                    boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
                    width: "260px",
                    bgcolor: "background.paper",
                    "& .MuiMenuItem-root": {
                      fontSize: "16px",
                      py: 1.2,
                    },
                  },
                },
              }}
            >
              <MenuItem value="all">All Users</MenuItem>
              <MenuItem value={UserRole.ADMIN}>Admin</MenuItem>
              <MenuItem value={UserRole.USER}>Customer</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Typography variant="body2" color="text.secondary" fontWeight="medium">
          Total: {totalCount} users
        </Typography>
      </Paper>

      {loading ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
        >
          <CircularProgress size={60} />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper} className={styles.tableContainer}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell className={styles.tableHeader}>ID</TableCell>
                  <TableCell className={styles.tableHeader}>
                    Full Name
                  </TableCell>
                  <TableCell className={styles.tableHeader}>Email</TableCell>
                  <TableCell className={styles.tableHeader}>Phone</TableCell>
                  <TableCell className={styles.tableHeader}>Gender</TableCell>
                  <TableCell className={styles.tableHeader}>Role</TableCell>
                  <TableCell className={styles.tableHeader}>Status</TableCell>
                  <TableCell className={styles.tableHeader}>
                    Created At
                  </TableCell>
                  <TableCell className={styles.tableHeader} align="center">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!users || users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <Typography variant="body1" color="text.secondary" py={4}>
                        No users found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id} hover className={styles.tableRow}>
                      <TableCell>
                        <Typography fontWeight="bold">{user.id}</Typography>
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
                              user.gender === "OTHER"
                                ? "1px solid #ddd"
                                : "none",
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.role}
                          color={
                            user.role === UserRole.ADMIN
                              ? "secondary"
                              : "default"
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
                        <Box
                          display="flex"
                          justifyContent="center"
                          alignItems="center"
                          gap={0.5}
                        >
                          <Tooltip title="View details">
                            <IconButton
                              color="primary"
                              onClick={() => handleViewUser(user)}
                              size="small"
                            >
                              <EyeOutlined />
                            </IconButton>
                          </Tooltip>
                          <Popconfirm
                            title="Delete this user?"
                            description="This will deactivate the user account"
                            onConfirm={() => handleDeleteUser(user.id)}
                            okText="Delete"
                            cancelText="Cancel"
                            disabled={user.id === currentUser?.id}
                          >
                            <Tooltip
                              title={
                                user.id === currentUser?.id
                                  ? "Cannot delete your own account"
                                  : ""
                              }
                            >
                              <span>
                                <IconButton
                                  color="error"
                                  disabled={user.id === currentUser?.id}
                                  size="small"
                                >
                                  <DeleteOutlined />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Popconfirm>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
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
        </>
      )}

      <Modal
        open={openModal}
        onClose={handleCloseModal}
        aria-labelledby="user-detail-modal"
        aria-describedby="user-detail-description"
      >
        <Box className={styles.modalContainer}>
          {loadingDetail ? (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              minHeight="300px"
            >
              <CircularProgress />
            </Box>
          ) : selectedUser ? (
            <>
              <Typography variant="h6" className={styles.modalTitle}>
                User Details - {selectedUser.id}
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
                <Typography variant="body1">
                  <strong>Last Login:</strong>{" "}
                  {formatDate(selectedUser.last_login)}
                </Typography>
                {selectedUser.deleted_at && (
                  <Typography variant="body1" color="error">
                    <strong>Deleted At:</strong>{" "}
                    {formatDate(selectedUser.deleted_at)}
                  </Typography>
                )}
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
          ) : null}
        </Box>
      </Modal>
    </Box>
  );
};

export default UserManagement;
