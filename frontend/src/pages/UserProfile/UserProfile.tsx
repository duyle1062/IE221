import React, { useState, FormEvent, ChangeEvent } from "react";
import styles from "./UserProfile.module.css";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";

interface UserProfileData {
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
}

interface Address {
  id: string;
  street: string;
  ward: string;
  province: string;
  phone: string;
  isDefault: boolean;
  is_active: boolean;
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
        <h2>{address?.id ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ mới"}</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="street">Địa chỉ (Số nhà, Tên đường)</label>
            <input
              id="street"
              name="street"
              value={formData.street}
              onChange={handleChange}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="ward">Phường/Xã</label>
            <input
              id="ward"
              name="ward"
              value={formData.ward}
              onChange={handleChange}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="province">Tỉnh/Thành phố</label>
            <input
              id="province"
              name="province"
              value={formData.province}
              onChange={handleChange}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="phone">Số điện thoại (người nhận)</label>
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
              Hủy
            </button>
            <button type="submit" className={styles.button}>
              Lưu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const UserProfile: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>("profile");

  const [message, setMessage] = useState<string>("");

  const [profile, setProfile] = useState<UserProfileData>({
    firstname: "Văn",
    lastname: "Nguyễn",
    email: "nguyenvana@example.com",
    phone: "0901234567",
  });
  const [editProfile, setEditProfile] = useState<UserProfileData>(profile);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const [addresses, setAddresses] = useState<Address[]>([
    {
      id: "1",
      street: "123 Đường ABC",
      ward: "Phường Cống Vị",
      province: "Quận Ba Đình, Hà Nội",
      phone: "0901111111",
      isDefault: true,
      is_active: true,
    },
    {
      id: "2",
      street: "456 Đường XYZ",
      ward: "Phường Bến Nghé",
      province: "Quận 1, TP. Hồ Chí Minh",
      phone: "0902222222",
      isDefault: false,
      is_active: true,
    },
  ]);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<Partial<Address> | null>(
    null
  );

  const [passwordData, setPasswordData] = useState({
    current: "",
    newPass: "",
    confirmPass: "",
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleProfileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = (e: FormEvent) => {
    e.preventDefault();
    console.log("Đang lưu thông tin:", editProfile);
    setProfile(editProfile);
    setIsEditingProfile(false);
    setMessage("Cập nhật thông tin thành công!");
    setTimeout(() => setMessage(""), 3000);
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

  const handleDeleteAddress = (id: string) => {
    if (window.confirm("Bạn có chắc muốn xóa địa chỉ này?")) {
      setAddresses((prev) => prev.filter((addr) => addr.id !== id));
      setMessage("Xóa địa chỉ thành công!");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleSetDefaultAddress = (id: string) => {
    setAddresses((prev) =>
      prev.map((addr) => ({ ...addr, isDefault: addr.id === id }))
    );
    setMessage("Đặt làm địa chỉ mặc định thành công!");
    setTimeout(() => setMessage(""), 3000);
  };

  const handleSaveAddress = (addressData: Partial<Address>) => {
    if (addressData.id) {
      setAddresses((prev) =>
        prev.map((addr) =>
          addr.id === addressData.id
            ? ({ ...addr, ...addressData } as Address)
            : addr
        )
      );
      setMessage("Cập nhật địa chỉ thành công!");
    } else {
      const newAddress: Address = {
        ...addressData,
        id: crypto.randomUUID(),
        isDefault: addresses.length === 0,
        is_active: true,
      } as Address;
      setAddresses((prev) => [...prev, newAddress]);
      setMessage("Thêm địa chỉ mới thành công!");
    }
    setIsAddressModalOpen(false);
    setCurrentAddress(null);
    setTimeout(() => setMessage(""), 3000);
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (passwordData.newPass !== passwordData.confirmPass) {
      setMessage("Mật khẩu mới không khớp!");
      return;
    }
    setMessage("Đổi mật khẩu thành công!");
    setPasswordData({ current: "", newPass: "", confirmPass: "" });
    setTimeout(() => setMessage(""), 3000);
  };

  const renderProfile = () => {
    if (isEditingProfile) {
      return (
        <form onSubmit={handleProfileSubmit}>
          <h3>Chỉnh sửa thông tin</h3>

          <div className={styles.formGroup}>
            <label htmlFor="lastname">Họ</label>
            <input
              id="lastname"
              name="lastname"
              value={editProfile.lastname}
              onChange={handleProfileChange}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="firstname">Tên</label>
            <input
              id="firstname"
              name="firstname"
              value={editProfile.firstname}
              onChange={handleProfileChange}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={editProfile.email}
              disabled
              readOnly
              style={{ backgroundColor: "#f5f5f5", cursor: "not-allowed" }}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="phone">Số điện thoại (tài khoản)</label>
            <input
              id="phone"
              name="phone"
              value={editProfile.phone}
              onChange={handleProfileChange}
            />
          </div>

          <div className={styles.buttonGroup}>
            <button
              type="button"
              className={`${styles.button} ${styles.buttonSecondary}`}
              onClick={handleCancelEditProfile}
            >
              Hủy
            </button>
            <button type="submit" className={styles.button}>
              Lưu thay đổi
            </button>
          </div>
        </form>
      );
    }

    return (
      <div className={styles.profileView}>
        <h3>Thông tin của bạn</h3>
        <p>
          <strong>Họ tên:</strong> {profile.lastname} {profile.firstname}
        </p>
        <p>
          <strong>Email:</strong> {profile.email}
        </p>
        <p>
          <strong>Số điện thoại:</strong> {profile.phone}
        </p>
        <button
          className={styles.button}
          onClick={() => setIsEditingProfile(true)}
        >
          Chỉnh sửa
        </button>
      </div>
    );
  };

  const renderAddress = () => (
    <div>
      <h3>Quản lý địa chỉ</h3>
      <button className={styles.button} onClick={handleOpenAddModal}>
        Thêm địa chỉ mới
      </button>
      <div className={styles.addressList}>
        {addresses.filter((addr) => addr.is_active).length === 0 ? (
          <p>Bạn chưa có địa chỉ nào.</p>
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
                    {addr.isDefault && (
                      <span className={styles.defaultBadge}>Mặc định</span>
                    )}
                  </p>
                  <p>SĐT: {addr.phone}</p>
                  <p>{addr.street}</p>
                  <p>
                    {addr.ward}, {addr.province}
                  </p>
                </div>
                <div className={styles.addressActions}>
                  <button
                    className={styles.buttonLink}
                    onClick={() => handleOpenEditModal(addr)}
                  >
                    Sửa
                  </button>
                  <button
                    className={`${styles.buttonLink} ${styles.buttonLinkDanger}`}
                    onClick={() => handleDeleteAddress(addr.id)}
                  >
                    Xóa
                  </button>
                  {!addr.isDefault && (
                    <button
                      className={styles.buttonLink}
                      onClick={() => handleSetDefaultAddress(addr.id)}
                    >
                      Đặt làm mặc định
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
      <h3>Thay đổi mật khẩu</h3>

      <div className={styles.formGroup}>
        <label htmlFor="current">Mật khẩu hiện tại</label>
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
        <label htmlFor="newPass">Mật khẩu mới</label>
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
        <label htmlFor="confirmPass">Xác nhận mật khẩu mới</label>
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

      <button type="submit" className={styles.button}>
        Đổi mật khẩu
      </button>
    </form>
  );

  return (
    <div className={styles.profileContainer}>
      <nav className={styles.nav}>
        <button
          className={`${styles.navButton} ${
            activeTab === "profile" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("profile")}
          aria-current={activeTab === "profile" ? "page" : undefined}
        >
          Thông tin cá nhân
        </button>
        <button
          className={`${styles.navButton} ${
            activeTab === "address" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("address")}
          aria-current={activeTab === "address" ? "page" : undefined}
        >
          Quản lý địa chỉ
        </button>
        <button
          className={`${styles.navButton} ${
            activeTab === "password" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("password")}
          aria-current={activeTab === "password" ? "page" : undefined}
        >
          Thay đổi mật khẩu
        </button>
      </nav>

      <div className={styles.content}>
        {message && <div className={styles.message}>{message}</div>}

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
  );
};

export default UserProfile;
