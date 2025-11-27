import React, { useState, FormEvent, ChangeEvent, useEffect } from "react";
import styles from "./UserProfile.module.css";
import { FaRegEye, FaRegEyeSlash, FaUser, FaEnvelope, FaPhone, 
  FaVenusMars, FaMapMarkerAlt, FaLock, FaUserCircle, FaEdit } from "react-icons/fa";
import userService, { UpdateProfileData } from "../../services/user.service";
import addressService, {
  CreateAddressData,
} from "../../services/address.service";
import { useAuth } from "../../context/AuthContext";
import { Gender } from "../../services/auth.service";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";

interface UserProfileData {
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  gender: Gender;
}

interface Address {
  id: number;
  street: string;
  ward: string;
  province: string;
  phone: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

type ActiveTab = "profile" | "address" | "password";

interface AddressModalProps {
  address: Partial<Address> | null;
  onClose: () => void;
  onSave: (addressData: Partial<Address>) => void;
}

const AddressModal: React.FC<AddressModalProps> = ({
  address,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    street: address?.street || "",
    ward: address?.ward || "",
    province: address?.province || "",
    phone: address?.phone || "",
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave({ ...address, ...formData });
  };

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modalContent}>
        <h2>{address?.id ? "Edit Address" : "Add New Address"}</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="street">Address (Street Name, House No.)</label>
            <input
              id="street"
              name="street"
              value={formData.street}
              onChange={handleChange}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="ward">Ward/Commune</label>
            <input
              id="ward"
              name="ward"
              value={formData.ward}
              onChange={handleChange}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="province">Province/City</label>
            <input
              id="province"
              name="province"
              value={formData.province}
              onChange={handleChange}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="phone">Phone Number (Receiver)</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>
          <div className={styles.modalActions}>
            <button
              type="button"
              className={`${styles.button} ${styles.buttonSecondary}`}
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className={styles.button}>
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const UserProfile: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>("profile");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success"
  );

  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: "", message: "", onConfirm: () => {} });

  const [profile, setProfile] = useState<UserProfileData>({
    firstname: "",
    lastname: "",
    email: "",
    phone: "",
    gender: Gender.OTHER,
  });
  const [editProfile, setEditProfile] = useState<UserProfileData>(profile);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<Partial<Address> | null>(
    null
  );

  const [passwordData, setPasswordData] = useState({
    current: "",
    newPass: "",
    confirmPass: "",
  });

  // Load user profile on mount only
  useEffect(() => {
    loadUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - run only once on mount

  // Load addresses when address tab is active
  useEffect(() => {
    if (activeTab === "address") {
      loadAddresses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const showMessage = (msg: string, type: "success" | "error" = "success") => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(""), 5000);
  };

  // Load user profile
  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const userData = await userService.getProfile();
      const profileData: UserProfileData = {
        firstname: userData.firstname,
        lastname: userData.lastname,
        email: userData.email,
        phone: userData.phone,
        gender: userData.gender,
      };
      setProfile(profileData);
      setEditProfile(profileData);
      await refreshUser();
    } catch (error: any) {
      console.error("Failed to load profile:", error);
      showMessage(error.message || "Unable to load user profile", "error");
    } finally {
      setLoading(false);
    }
  };

  // Load addresses
  const loadAddresses = async () => {
    try {
      setLoading(true);
      const addressList = await addressService.getAddresses();
      setAddresses(addressList);
    } catch (error: any) {
      console.error("Failed to load addresses:", error);
      showMessage(error.message || "Unable to load address list", "error");
    } finally {
      setLoading(false);
    }
  };

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleProfileChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEditProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const updateData: UpdateProfileData = {
        firstname: editProfile.firstname,
        lastname: editProfile.lastname,
        phone: editProfile.phone,
        gender: editProfile.gender,
      };
      const updatedUser = await userService.updateProfile(updateData);

      const profileData: UserProfileData = {
        firstname: updatedUser.firstname,
        lastname: updatedUser.lastname,
        email: updatedUser.email,
        phone: updatedUser.phone,
        gender: updatedUser.gender,
      };

      setProfile(profileData);
      setEditProfile(profileData);
      setIsEditingProfile(false);
      await refreshUser();
      showMessage("Profile updated successfully!");
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      showMessage(
        error.errors?.detail || error.message || "Unable to update profile",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEditProfile = () => {
    setEditProfile(profile);
    setIsEditingProfile(false);
  };

  const handleOpenAddModal = () => {
    setCurrentAddress(null);
    setIsAddressModalOpen(true);
  };

  const handleOpenEditModal = (address: Address) => {
    setCurrentAddress(address);
    setIsAddressModalOpen(true);
  };

  const handleDeleteAddress = (id: number) => {
    setConfirmationModal({
      isOpen: true,
      title: "Delete Address",
      message: "Are you sure you want to delete this address?",
      onConfirm: async () => {
        try {
          setLoading(true);
          await addressService.deleteAddress(id);
          await loadAddresses();
          showMessage("Address deleted successfully!");
        } catch (error: any) {
          console.error("Failed to delete address:", error);
          showMessage(error.message || "Unable to delete address", "error");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleSetDefaultAddress = async (id: number) => {
    try {
      setLoading(true);
      await addressService.setDefaultAddress(id);
      await loadAddresses();
      showMessage("Set as default address successfully!");
    } catch (error: any) {
      console.error("Failed to set default address:", error);
      showMessage(error.message || "Unable to set default address", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAddress = async (addressData: Partial<Address>) => {
    try {
      setLoading(true);
      if (addressData.id) {
        // Update existing address
        await addressService.updateAddress(addressData.id, {
          street: addressData.street!,
          ward: addressData.ward!,
          province: addressData.province!,
          phone: addressData.phone!,
        });
        showMessage("Address updated successfully!");
      } else {
        // Create new address
        const createData: CreateAddressData = {
          street: addressData.street!,
          ward: addressData.ward!,
          province: addressData.province!,
          phone: addressData.phone!,
          is_default: addresses.length === 0,
        };
        await addressService.createAddress(createData);
        showMessage("New address added successfully!");
      }
      await loadAddresses();
      setIsAddressModalOpen(false);
    } catch (error: any) {
      console.error("Failed to save address:", error);
      showMessage(
        error.errors?.detail || error.message || "Unable to save address",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (passwordData.newPass !== passwordData.confirmPass) {
      showMessage("New passwords do not match!", "error");
      return;
    }

    try {
      setLoading(true);
      await userService.changePassword({
        current_password: passwordData.current,
        new_password: passwordData.newPass,
        confirm_password: passwordData.confirmPass,
      });

      setPasswordData({
        current: "",
        newPass: "",
        confirmPass: "",
      });
      showMessage("Password changed successfully!");
    } catch (error: any) {
      console.error("Failed to change password:", error);
      const errorMsg =
        error.errors?.current_password?.[0] ||
        error.errors?.new_password?.[0] ||
        error.errors?.confirm_password?.[0] ||
        error.message ||
        "Unable to change password";
      showMessage(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  const renderProfile = () => {
    if (isEditingProfile) {
      return (
        <form onSubmit={handleProfileSubmit} className={styles.fadeIn}>
          <h3>Edit Personal Information</h3>
          
          <div className={styles.infoGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="lastname">Last Name</label>
              <input
                id="lastname"
                name="lastname"
                value={editProfile.lastname}
                onChange={handleProfileChange}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="firstname">First Name</label>
              <input
                id="firstname"
                name="firstname"
                value={editProfile.firstname}
                onChange={handleProfileChange}
                required
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              value={editProfile.email}
              disabled
              readOnly
            />
            <small style={{color: '#888', marginTop: '5px', display: 'block'}}>Email cannot be changed.</small>
          </div>

          <div className={styles.infoGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="phone">Phone Number</label>
              <input
                id="phone"
                name="phone"
                value={editProfile.phone}
                onChange={handleProfileChange}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="gender">Gender</label>
              <select
                id="gender"
                name="gender"
                value={editProfile.gender}
                onChange={handleProfileChange}
                required
              >
                <option value={Gender.MALE}>Male</option>
                <option value={Gender.FEMALE}>Female</option>
                <option value={Gender.OTHER}>Other</option>
              </select>
            </div>
          </div>

          <div className={styles.buttonGroup}>
            <button
              type="button"
              className={`${styles.button} ${styles.buttonSecondary}`}
              onClick={handleCancelEditProfile}
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className={styles.button} disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      );
    }

    // 2. Chế độ Xem (View Mode) - Đẹp hơn
    return (
      <div className={styles.profileView}>
        {/* Header section: Avatar + Name */}
        <div className={styles.profileHeader}>
            <div className={styles.avatarWrapper}>
                <FaUser />
            </div>
            <div className={styles.profileSummary}>
                <h2>{profile.lastname} {profile.firstname}</h2>
                <p>{profile.email}</p>
            </div>
        </div>

        <h3>Personal Details</h3>
        <div className={styles.infoGrid}>
            <div className={styles.infoCard}>
                <div className={styles.infoLabel}>
                    <FaUserCircle /> Fullname
                </div>
                <div className={styles.infoValue}>
                    {profile.lastname} {profile.firstname}
                </div>
            </div>

            <div className={styles.infoCard}>
                <div className={styles.infoLabel}>
                    <FaEnvelope /> Email
                </div>
                <div className={styles.infoValue}>
                    {profile.email}
                </div>
            </div>

            <div className={styles.infoCard}>
                <div className={styles.infoLabel}>
                    <FaPhone /> Phone
                </div>
                <div className={styles.infoValue}>
                    {profile.phone || "Not provided"}
                </div>
            </div>

            <div className={styles.infoCard}>
                <div className={styles.infoLabel}>
                    <FaVenusMars /> Gender
                </div>
                <div className={styles.infoValue}>
                    {profile.gender === Gender.MALE
                        ? "Male"
                        : profile.gender === Gender.FEMALE
                        ? "Female"
                        : "Other"}
                </div>
            </div>
        </div>

        <div style={{ marginTop: "2rem" }}>
            <button
              className={styles.button}
              onClick={() => setIsEditingProfile(true)}
              disabled={loading}
            >
              <FaEdit /> Edit Profile
            </button>
        </div>
      </div>
    );
  };

  const renderAddress = () => (
    <div>
      <h3>Address Management</h3>
      <button
        className={styles.button}
        onClick={handleOpenAddModal}
        disabled={loading}
      >
        Add New Address
      </button>
      <div className={styles.addressList}>
        {addresses.filter((addr) => addr.is_active).length === 0 ? (
          <p>You have no addresses</p>
        ) : (
          addresses
            .filter((addr) => addr.is_active)
            .map((addr) => (
              <div key={addr.id} className={styles.addressItem}>
                <div className={styles.addressDetails}>
                  <p>
                    <strong>
                      {profile.lastname} {profile.firstname}
                    </strong>
                    {addr.is_default && (
                      <span className={styles.defaultBadge}>Default</span>
                    )}
                  </p>
                  <p>Phone: {addr.phone}</p>
                  <p>{addr.street}</p>
                  <p>
                    {addr.ward}, {addr.province}
                  </p>
                </div>
                <div className={styles.addressActions}>
                  <button
                    className={styles.buttonLink}
                    onClick={() => handleOpenEditModal(addr)}
                    disabled={loading}
                  >
                    Edit
                  </button>
                  <button
                    className={`${styles.buttonLink} ${styles.buttonLinkDanger}`}
                    onClick={() => handleDeleteAddress(addr.id)}
                    disabled={loading}
                  >
                    Delete
                  </button>
                  {!addr.is_default && (
                    <button
                      className={styles.buttonLink}
                      onClick={() => handleSetDefaultAddress(addr.id)}
                      disabled={loading}
                    >
                      Set as Default
                    </button>
                  )}
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );

  const renderPassword = () => (
    <form onSubmit={handlePasswordSubmit}>
      <h3>Change Password</h3>

      <div className={styles.formGroup}>
        <label htmlFor="current">Current Password</label>
        <div className={styles.passwordInputWrapper}>
          <input
            id="current"
            name="current"
            type={showCurrentPassword ? "text" : "password"}
            value={passwordData.current}
            onChange={handlePasswordChange}
            required
          />
          <span
            className={styles.passwordToggleIcon}
            onClick={() => setShowCurrentPassword((prev) => !prev)}
          >
            {showCurrentPassword ? <FaRegEyeSlash /> : <FaRegEye />}
          </span>
        </div>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="newPass">New Password</label>
        <div className={styles.passwordInputWrapper}>
          <input
            id="newPass"
            name="newPass"
            type={showNewPassword ? "text" : "password"}
            value={passwordData.newPass}
            onChange={handlePasswordChange}
            required
          />
          <span
            className={styles.passwordToggleIcon}
            onClick={() => setShowNewPassword((prev) => !prev)}
          >
            {showNewPassword ? <FaRegEyeSlash /> : <FaRegEye />}
          </span>
        </div>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="confirmPass">Confirm New Password</label>
        <div className={styles.passwordInputWrapper}>
          <input
            id="confirmPass"
            name="confirmPass"
            type={showConfirmPassword ? "text" : "password"}
            value={passwordData.confirmPass}
            onChange={handlePasswordChange}
            required
          />
          <span
            className={styles.passwordToggleIcon}
            onClick={() => setShowConfirmPassword((prev) => !prev)}
          >
            {showConfirmPassword ? <FaRegEyeSlash /> : <FaRegEye />}
          </span>
        </div>
      </div>

      <button type="submit" className={styles.button} disabled={loading}>
        {loading ? "Processing..." : "Change Password"}
      </button>
    </form>
  );

  return (
    <>
      <Header />
      <div className={styles.profileContainer}>
        <nav className={styles.nav}>
          <button
            className={`${styles.navButton} ${
              activeTab === "profile" ? styles.active : ""
            }`}
            onClick={() => setActiveTab("profile")}
            aria-current={activeTab === "profile" ? "page" : undefined}
            disabled={loading}
          >
            <FaUser /> Personal Info
          </button>
          <button
            className={`${styles.navButton} ${
              activeTab === "address" ? styles.active : ""
            }`}
            onClick={() => setActiveTab("address")}
            aria-current={activeTab === "address" ? "page" : undefined}
            disabled={loading}
          >
            <FaMapMarkerAlt /> Addresses
          </button>
          <button
            className={`${styles.navButton} ${
              activeTab === "password" ? styles.active : ""
            }`}
            onClick={() => setActiveTab("password")}
            aria-current={activeTab === "password" ? "page" : undefined}
            disabled={loading}
          >
            <FaLock /> Password
          </button>
        </nav>

        <div className={styles.content}>
          {message && (
            <div
              className={`${styles.message} ${
                messageType === "error"
                  ? styles.messageError
                  : styles.messageSuccess
              }`}
            >
              {message}
            </div>
          )}

          {activeTab === "profile" && renderProfile()}
          {activeTab === "address" && renderAddress()}
          {activeTab === "password" && renderPassword()}
        </div>

        {isAddressModalOpen && (
          <AddressModal
            address={currentAddress}
            onClose={() => setIsAddressModalOpen(false)}
            onSave={handleSaveAddress}
          />
        )}
      </div>

      {confirmationModal.isOpen && (
        <div
          className={styles.modalOverlay}
          onClick={() =>
            setConfirmationModal((prev) => ({ ...prev, isOpen: false }))
          }
        >
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>{confirmationModal.title}</h3>
            <p className={styles.modalText}>{confirmationModal.message}</p>
            <div className={styles.modalActions}>
              <button
                className={`${styles.modalBtn} ${styles.btnCancel}`}
                onClick={() =>
                  setConfirmationModal((prev) => ({ ...prev, isOpen: false }))
                }
              >
                Cancel
              </button>
              <button
                className={`${styles.modalBtn} ${styles.btnConfirm}`}
                onClick={() => {
                  confirmationModal.onConfirm();
                  setConfirmationModal((prev) => ({ ...prev, isOpen: false }));
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </>
  );
};

export default UserProfile;
