"use client";

import { useState, FormEvent, useEffect } from "react";
import { X, Eye, EyeOff } from "lucide-react";
import type {
  User,
  UserCreateRequest,
  UserUpdateRequest,
} from "@/src/lib/types/user";
import type { Branch } from "@/src/lib/types/branch";

type UserFormModalProps = {
  isOpen: boolean;
  user?: User | null;
  branches: Branch[];
  onClose: () => void;
  onSubmit: (data: UserCreateRequest | UserUpdateRequest) => Promise<void>;
  loading?: boolean;
};

/** Roles admitidos por el backend (NestJS). */
const ROLES = [
  { value: "superadmin", label: "Admin Corporativo" },
  { value: "administrador", label: "Administrador" },
  { value: "gerente", label: "Gerente" },
  { value: "asesor", label: "Asesor" },
  { value: "jefe_mecanico", label: "Jefe Mecánico" },
  { value: "mecanico", label: "Mecánico" },
  { value: "cliente", label: "Cliente" },
];

const PERMISSIONS = [
  { value: "users.read", label: "Leer Usuarios" },
  { value: "users.create", label: "Crear Usuarios" },
  { value: "users.update", label: "Actualizar Usuarios" },
  { value: "users.delete", label: "Eliminar Usuarios" },
  { value: "clients.read", label: "Leer Clientes" },
  { value: "clients.create", label: "Crear Clientes" },
  { value: "clients.update", label: "Actualizar Clientes" },
  { value: "clients.delete", label: "Eliminar Clientes" },
  { value: "vehicles.read", label: "Leer Vehículos" },
  { value: "vehicles.create", label: "Crear Vehículos" },
  { value: "vehicles.update", label: "Actualizar Vehículos" },
  { value: "vehicles.delete", label: "Eliminar Vehículos" },
  { value: "appointments.read", label: "Leer Citas" },
  { value: "appointments.create", label: "Crear Citas" },
  { value: "appointments.update", label: "Actualizar Citas" },
  { value: "appointments.delete", label: "Eliminar Citas" },
  { value: "branches.read", label: "Leer Sucursales" },
  { value: "branches.create", label: "Crear Sucursales" },
  { value: "branches.update", label: "Actualizar Sucursales" },
  { value: "branches.delete", label: "Eliminar Sucursales" },
  { value: "reports.read", label: "Leer Reportes" },
];

export default function UserFormModal({
  isOpen,
  user,
  branches,
  onClose,
  onSubmit,
  loading = false,
}: UserFormModalProps) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
    full_name: "",
    branch_id: "",
    role: "",
    permissions: [] as string[],
    status: "active",
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof typeof formData, string>>
  >({});
  const [showPassword, setShowPassword] = useState(false);

  // Cargar datos cuando se abre el modal para editar
  useEffect(() => {
    if (!isOpen) return;

    if (user) {
      // Modo edición: cargar datos del usuario
      setFormData({
        email: user.email || "",
        password: "", // No cargar password en edición
        username: user.username || "",
        full_name: user.full_name || "",
        branch_id: user.branch_id || "",
        role: user.role || "",
        permissions: user.permissions || [],
        status: user.status || "active",
      });
    } else {
      // Modo creación: resetear formulario
      setFormData({
        email: "",
        password: "",
        username: "",
        full_name: "",
        branch_id: "",
        role: "",
        permissions: [],
        status: "active",
      });
    }
    setErrors({});
    setShowPassword(false);
  }, [isOpen, user?._id]);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Limpiar error del campo
    if (errors[name as keyof typeof formData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handlePermissionToggle = (permission: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const handleSelectAllPermissions = () => {
    if (formData.permissions.length === PERMISSIONS.length) {
      setFormData((prev) => ({ ...prev, permissions: [] }));
    } else {
      setFormData((prev) => ({
        ...prev,
        permissions: PERMISSIONS.map((p) => p.value),
      }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof typeof formData, string>> = {};

    if (!formData.email.trim()) {
      newErrors.email = "El email es requerido";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = "Por favor, ingresa un correo electrónico válido";
      }
    }

    // Password es requerido solo al crear
    if (!user && !formData.password.trim()) {
      newErrors.password = "La contraseña es requerida";
    } else if (formData.password && formData.password.length < 8) {
      newErrors.password = "La contraseña debe tener al menos 8 caracteres";
    }

    if (!formData.username.trim()) {
      newErrors.username = "El nombre de usuario es requerido";
    }

    if (!formData.full_name.trim()) {
      newErrors.full_name = "El nombre completo es requerido";
    }

    if (!formData.branch_id.trim()) {
      newErrors.branch_id = "La sucursal es requerida";
    }

    if (!formData.role.trim()) {
      newErrors.role = "El rol es requerido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      if (user) {
        // Actualizar usuario - incluir todos los campos del formulario
        // (el backend debe manejar cuáles son opcionales)
        const updateData: UserUpdateRequest = {
          username: formData.username.trim(),
          full_name: formData.full_name.trim(),
          branch_id: formData.branch_id,
          role: formData.role,
          permissions: formData.permissions,
          status: formData.status,
        };

        // Solo incluir password si se proporcionó uno nuevo
        if (formData.password.trim()) {
          updateData.password = formData.password;
        }

        console.log("Datos a actualizar:", updateData);
        await onSubmit(updateData);
      } else {
        // Crear usuario: solo los campos del ejemplo POST /users de la documentación
        const createData: UserCreateRequest = {
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          username: formData.username.trim(),
          full_name: formData.full_name.trim(),
          branch_id: formData.branch_id,
          role: formData.role,
        };

        await onSubmit(createData);
      }
      setErrors({});
    } catch (error) {
      console.error("Error en handleSubmit del modal:", error);
      if (error && typeof error === "object" && "details" in error) {
        const details = (error as { details?: unknown }).details;
        if (details && typeof details === "object") {
          const detailsObj = details as { [key: string]: unknown };
          const fieldErrors: Partial<Record<keyof typeof formData, string>> =
            {};
          Object.keys(detailsObj).forEach((key) => {
            if (key in formData) {
              const errorValue = detailsObj[key];
              if (typeof errorValue === "string") {
                fieldErrors[key as keyof typeof formData] = errorValue;
              } else if (Array.isArray(errorValue) && errorValue.length > 0) {
                fieldErrors[key as keyof typeof formData] = String(
                  errorValue[0]
                );
              }
            }
          });
          if (Object.keys(fieldErrors).length > 0) {
            setErrors(fieldErrors);
          }
        }
      }
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        email: "",
        password: "",
        username: "",
        full_name: "",
        branch_id: "",
        role: "",
        permissions: [],
        status: "active",
      });
      setErrors({});
      setShowPassword(false);
      onClose();
    }
  };

  const isEditing = !!user;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {isEditing ? "Editar Usuario" : "Alta de Usuario"}
          </h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Información Básica */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Información Básica
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nombre Completo */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                  Nombre Completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Juan Pérez"
                  className={`w-full rounded-xl bg-gray-100 dark:bg-zinc-800 border px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-400 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 transition-colors ${
                    errors.full_name
                      ? "border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/30"
                      : "border-gray-100 dark:border-zinc-700 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                  }`}
                  disabled={loading}
                />
                {errors.full_name && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.full_name}
                  </p>
                )}
              </div>

              {/* Username */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                  Nombre de Usuario <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="jperez"
                  className={`w-full rounded-xl bg-gray-100 dark:bg-zinc-800 border px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-400 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 transition-colors ${
                    errors.username
                      ? "border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/30"
                      : "border-gray-100 dark:border-zinc-700 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                  }`}
                  disabled={loading}
                />
                {errors.username && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.username}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="usuario@ejemplo.com"
                  className={`w-full rounded-xl bg-gray-100 dark:bg-zinc-800 border px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-400 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 transition-colors ${
                    errors.email
                      ? "border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/30"
                      : "border-gray-100 dark:border-zinc-700 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                  }`}
                  disabled={loading || isEditing}
                />
                {errors.email && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.email}
                  </p>
                )}
                {isEditing && (
                  <p className="text-xs text-gray-500 dark:text-zinc-400">
                    El email no se puede modificar
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                  Contraseña{" "}
                  {!isEditing && <span className="text-red-500">*</span>}
                  {isEditing && (
                    <span className="text-xs text-gray-500 dark:text-zinc-400 ml-2">
                      (dejar vacío para no cambiar)
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={
                      isEditing
                        ? "Nueva contraseña (opcional)"
                        : "Contraseña segura"
                    }
                    className={`w-full rounded-xl bg-gray-100 dark:bg-zinc-800 border px-4 py-3 pr-10 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-400 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 transition-colors ${
                      errors.password
                        ? "border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/30"
                        : "border-gray-100 dark:border-zinc-700 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                    }`}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.password}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Información de Rol y Sucursal */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Rol y Sucursal
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Rol */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                  Rol <span className="text-red-500">*</span>
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className={`w-full rounded-xl bg-gray-100 dark:bg-zinc-800 border px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 transition-colors ${
                    errors.role
                      ? "border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/30"
                      : "border-gray-100 dark:border-zinc-700 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                  }`}
                  disabled={loading}
                >
                  <option value="">Selecciona un rol</option>
                  {ROLES.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
                {errors.role && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.role}
                  </p>
                )}
              </div>

              {/* Sucursal */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                  Sucursal <span className="text-red-500">*</span>
                </label>
                <select
                  name="branch_id"
                  value={formData.branch_id}
                  onChange={handleChange}
                  className={`w-full rounded-xl bg-gray-100 dark:bg-zinc-800 border px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 transition-colors ${
                    errors.branch_id
                      ? "border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/30"
                      : "border-gray-100 dark:border-zinc-700 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                  }`}
                  disabled={loading}
                >
                  <option value="">Selecciona una sucursal</option>
                  {branches.map((branch) => {
                    const branchId =
                      (branch as Branch & { _id?: string })._id ||
                      branch.id ||
                      "";
                    return (
                      <option key={branchId} value={branchId}>
                        {branch.name}
                      </option>
                    );
                  })}
                </select>
                {errors.branch_id && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.branch_id}
                  </p>
                )}
              </div>

              {/* Estado (solo en edición) */}
              {isEditing && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                    Estado
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full rounded-xl bg-gray-100 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-colors"
                    disabled={loading}
                  >
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Permisos (solo se envían en PATCH; en POST el backend usa los del rol) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Permisos
                </h3>
                {!isEditing && (
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                    En la creación se usan los permisos del rol. Se pueden personalizar al editar.
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={handleSelectAllPermissions}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                {formData.permissions.length === PERMISSIONS.length
                  ? "Deseleccionar todos"
                  : "Seleccionar todos"}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-4 bg-gray-50 dark:bg-zinc-800 rounded-xl">
              {PERMISSIONS.map((permission) => (
                <label
                  key={permission.value}
                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                    formData.permissions.includes(permission.value)
                      ? "bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500"
                      : "bg-white dark:bg-zinc-900 border-2 border-gray-200 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-600"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.permissions.includes(permission.value)}
                    onChange={() => handlePermissionToggle(permission.value)}
                    className="w-4 h-4 text-blue-600 rounded"
                    disabled={loading}
                  />
                  <span className="text-sm text-gray-900 dark:text-white">
                    {permission.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Botones */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-6 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  {isEditing ? "Guardando..." : "Creando..."}
                </>
              ) : isEditing ? (
                "Guardar Cambios"
              ) : (
                "Crear Usuario"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
