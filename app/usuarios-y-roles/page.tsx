"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Users,
  Tag,
  Lock,
} from "lucide-react";
import { getAccessToken } from "@/src/lib/auth";
import { apiFetch } from "@/src/lib/api";
import type {
  User,
  UsersResponse,
  UserCreateRequest,
  UserCreateResponse,
  UserUpdateRequest,
} from "@/src/lib/types/user";
import type { Branch } from "@/src/lib/types/branch";
import UserFormModal from "./components/UserFormModal";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

type TabType = "usuarios" | "roles" | "permisos";

export default function UsuariosRolesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("usuarios");
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);

  // Verificar autenticación
  useEffect(() => {
    if (!getAccessToken()) {
      router.replace("/login");
    }
  }, [router]);

  // Cargar sucursales
  const fetchBranches = useCallback(async () => {
    try {
      const response = await apiFetch<{
        ok: boolean;
        message: string;
        data: Branch[];
      }>("/branches", {
        method: "GET",
      });

      if (response.ok && Array.isArray(response.data)) {
        const normalizedBranches = response.data.map(
          (branch: Branch & { _id?: string }) => ({
            ...branch,
            _id: branch._id || branch.id || String(branch.code),
            id: branch.id || branch._id || String(branch.code),
          })
        );
        setBranches(normalizedBranches);
      }
    } catch (err) {
      console.error("Error al cargar sucursales:", err);
    }
  }, []);

  // Cargar usuarios
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiFetch<UsersResponse>("/users", {
        method: "GET",
      });

      if (response.ok && Array.isArray(response.data)) {
        const normalizedUsers = response.data.map((user: User) => ({
          ...user,
          id: user.id || user._id,
        }));

        setUsers(normalizedUsers);
        setFilteredUsers(normalizedUsers);
      } else {
        setError(response.message || "No se pudieron cargar los usuarios");
        setUsers([]);
        setFilteredUsers([]);
      }
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
      const errorMessage =
        err && typeof err === "object" && "message" in err
          ? String(err.message)
          : "Error al cargar los usuarios. Por favor, intenta nuevamente.";
      setError(errorMessage);
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (getAccessToken()) {
      fetchUsers();
      fetchBranches();
    }
  }, [fetchUsers, fetchBranches]);

  // Filtrar usuarios
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = users.filter((user) => {
      const branch = branches.find((b) => {
        const branchWithId = b as Branch & { _id?: string };
        return branchWithId._id === user.branch_id || b.id === user.branch_id;
      });

      return (
        user.email.toLowerCase().includes(term) ||
        user.username.toLowerCase().includes(term) ||
        user.full_name.toLowerCase().includes(term) ||
        user.role.toLowerCase().includes(term) ||
        (branch && branch.name.toLowerCase().includes(term))
      );
    });
    setFilteredUsers(filtered);
  }, [searchTerm, users, branches]);

  // Ver usuario
  const handleViewUser = (user: User) => {
    setViewingUser(user);
  };

  // Editar usuario
  const handleEditUser = (user: User) => {
    if (!user.id && !user._id) {
      setError("Error: El usuario no tiene un ID válido");
      return;
    }
    setEditingUser(user);
    setIsModalOpen(true);
    setError(null);
  };

  // Crear o actualizar usuario
  const handleSubmitUser = async (
    data: UserCreateRequest | UserUpdateRequest
  ) => {
    try {
      setFormLoading(true);
      setError(null);

      if (editingUser) {
        // Validar que el usuario tenga un ID
        const userId = editingUser.id || editingUser._id;
        if (!userId) {
          throw new Error("El usuario no tiene un ID válido para actualizar");
        }

        // Actualizar usuario existente
        const response = await apiFetch<UserCreateResponse>(
          `/users/${userId}`,
          {
            method: "PATCH",
            body: JSON.stringify(data),
          }
        );

        if (response && response.ok && response.data) {
          await fetchUsers();
          setIsModalOpen(false);
          setEditingUser(null);
          setError(null);
        } else {
          const message = response?.message || "Error al actualizar el usuario";
          throw new Error(message);
        }
      } else {
        // Crear nuevo usuario
        const response = await apiFetch<UserCreateResponse>("/users", {
          method: "POST",
          body: JSON.stringify(data),
        });

        if (response && response.ok && response.data) {
          await fetchUsers();
          setIsModalOpen(false);
          setEditingUser(null);
          setError(null);
        } else {
          const message = response?.message || "Error al crear el usuario";
          throw new Error(message);
        }
      }
    } catch (err) {
      console.error("Error al guardar usuario:", err);

      let errorMessage = "Error desconocido. Por favor, intenta nuevamente.";

      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (err && typeof err === "object") {
        const apiErr = err as {
          message?: string;
          status?: number;
          details?: unknown;
        };

        if (apiErr.details) {
          if (typeof apiErr.details === "object") {
            const details = apiErr.details as {
              message?: string;
              error?: string;
              [key: string]: unknown;
            };

            if (details.message && typeof details.message === "string") {
              errorMessage = details.message;
            } else if (details.error && typeof details.error === "string") {
              errorMessage = details.error;
            } else if (Array.isArray(details.errors)) {
              const errorMessages = details.errors
                .filter(
                  (e: unknown) =>
                    typeof e === "string" ||
                    (typeof e === "object" && e !== null && "message" in e)
                )
                .map((e: unknown) => {
                  if (typeof e === "string") return e;
                  if (typeof e === "object" && e !== null && "message" in e) {
                    return String((e as { message: unknown }).message);
                  }
                  return String(e);
                });
              errorMessage = errorMessages.join(", ") || errorMessage;
            }
          } else if (typeof apiErr.details === "string") {
            errorMessage = apiErr.details;
          }
        }

        if (
          errorMessage ===
            "Error desconocido. Por favor, intenta nuevamente." &&
          apiErr.message
        ) {
          errorMessage = apiErr.message;
        }

        if (apiErr.status && errorMessage) {
          errorMessage = `Error ${apiErr.status}: ${errorMessage}`;
        }
      }

      if (
        errorMessage === "Error desconocido. Por favor, intenta nuevamente."
      ) {
        errorMessage = editingUser
          ? "Error al actualizar el usuario. Por favor, intenta nuevamente."
          : "Error al crear el usuario. Por favor, intenta nuevamente.";
      }

      setError(errorMessage);
      throw err;
    } finally {
      setFormLoading(false);
    }
  };

  // Helper functions
  const getBranchName = (branchId: string): string => {
    const branch = branches.find((b) => {
      const branchWithId = b as Branch & { _id?: string };
      return branchWithId._id === branchId || b.id === branchId;
    });
    return branch ? branch.name : "Sucursal no encontrada";
  };

  const getInitials = (name: string): string => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getRoleLabel = (role: string): string => {
    const roleMap: Record<string, string> = {
      superadmin: "Super Admin",
      administrador: "Administrador",
      "branch admin": "Branch Admin",
      "workshop manager": "Workshop Manager",
      mechanic: "Mecánico",
      "front desk": "Front Desk",
    };
    return roleMap[role.toLowerCase()] || role;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 transition-colors duration-300">
      <Sidebar />
      <Header />
      <main className="ml-60 pt-16 p-6">
        {/* Header Section */}
        <div className="mb-6">
          <h1 className="title-primary">Usuarios y Roles</h1>
          <p className="subtitle mt-1">
            Gestión de usuarios, roles y permisos del sistema
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-gray-200 dark:border-zinc-800">
          <button
            onClick={() => {
              setActiveTab("usuarios");
              setSearchTerm("");
            }}
            className={`px-4 py-2 border-b-2 font-semibold flex items-center gap-2 transition-colors ${
              activeTab === "usuarios"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300"
            }`}
          >
            <Users size={18} />
            Usuarios
          </button>
          <button
            onClick={() => {
              setActiveTab("roles");
              setSearchTerm("");
            }}
            className={`px-4 py-2 border-b-2 font-semibold flex items-center gap-2 transition-colors ${
              activeTab === "roles"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300"
            }`}
          >
            <Tag size={18} />
            Roles
          </button>
          <button
            onClick={() => {
              setActiveTab("permisos");
              setSearchTerm("");
            }}
            className={`px-4 py-2 border-b-2 font-semibold flex items-center gap-2 transition-colors ${
              activeTab === "permisos"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300"
            }`}
          >
            <Lock size={18} />
            Permisos
          </button>
        </div>

        {/* Search and Action Bar - Solo mostrar en tab de usuarios */}
        {activeTab === "usuarios" && (
          <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full sm:max-w-md">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-400">
                <Search size={20} />
              </div>
              <input
                type="text"
                placeholder="Buscar usuarios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-zinc-400 outline-none focus:ring-4 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-colors"
              />
            </div>
            <button
              onClick={() => {
                setEditingUser(null);
                setIsModalOpen(true);
                setError(null);
              }}
              className="button-text w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              Nuevo Usuario
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
            <svg
              className="w-5 h-5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Content based on active tab */}
        {activeTab === "usuarios" ? (
          <>
            {/* Loading State */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-4">
                  <svg
                    className="animate-spin h-8 w-8 text-blue-600"
                    viewBox="0 0 24 24"
                  >
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
                  <p className="label">Cargando usuarios...</p>
                </div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-4 rounded-full bg-gray-100 dark:bg-zinc-800 mb-4">
                  <Users
                    size={48}
                    className="text-gray-400 dark:text-zinc-500"
                  />
                </div>
                <h3 className="card-title mb-2">
                  {searchTerm
                    ? "No se encontraron usuarios"
                    : "No hay usuarios registrados"}
                </h3>
                <p className="label mb-6">
                  {searchTerm
                    ? "Intenta con otro término de búsqueda"
                    : 'Crea tu primer usuario haciendo clic en "Nuevo Usuario"'}
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => {
                      setEditingUser(null);
                      setIsModalOpen(true);
                      setError(null);
                    }}
                    className="button-text px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors flex items-center gap-2"
                  >
                    <Plus size={20} />
                    Nuevo Usuario
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Lista de Usuarios
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-zinc-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-zinc-300 uppercase tracking-wider">
                          Usuario
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-zinc-300 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-zinc-300 uppercase tracking-wider">
                          Rol
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-zinc-300 uppercase tracking-wider">
                          Sucursal
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-zinc-300 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-zinc-300 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-zinc-900 divide-y divide-gray-200 dark:divide-zinc-800">
                      {filteredUsers.map((user) => {
                        const initials = getInitials(user.full_name);
                        return (
                          <tr
                            key={user.id || user._id}
                            className="hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-zinc-700 flex items-center justify-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                                  {initials}
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {user.full_name}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-zinc-400">
                                    @{user.username}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-900 dark:text-white">
                                {user.email}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-900 dark:text-white">
                                {getRoleLabel(user.role)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-900 dark:text-white">
                                {getBranchName(user.branch_id)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  user.status === "active"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                    : user.status === "inactive"
                                    ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                    : user.is_locked
                                    ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
                                    : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                                }`}
                              >
                                {user.status === "active"
                                  ? "Activo"
                                  : user.status === "inactive"
                                  ? "Inactivo"
                                  : user.is_locked
                                  ? "Bloqueado"
                                  : "Desconocido"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleViewUser(user)}
                                  className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors"
                                  aria-label="Ver usuario"
                                >
                                  <Eye size={18} />
                                </button>
                                <button
                                  onClick={() => handleEditUser(user)}
                                  className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors"
                                  aria-label="Editar usuario"
                                >
                                  <Pencil size={18} />
                                </button>
                                <button
                                  className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors"
                                  aria-label="Eliminar usuario"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : activeTab === "roles" ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 rounded-full bg-gray-100 dark:bg-zinc-800 mb-4">
              <Tag size={48} className="text-gray-400 dark:text-zinc-500" />
            </div>
            <h3 className="card-title mb-2">Funcionalidad en desarrollo</h3>
            <p className="label">
              La gestión de roles estará disponible próximamente
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 rounded-full bg-gray-100 dark:bg-zinc-800 mb-4">
              <Lock size={48} className="text-gray-400 dark:text-zinc-500" />
            </div>
            <h3 className="card-title mb-2">Funcionalidad en desarrollo</h3>
            <p className="label">
              La gestión de permisos estará disponible próximamente
            </p>
          </div>
        )}

        {/* Modal de Formulario */}
        <UserFormModal
          isOpen={isModalOpen}
          user={editingUser}
          branches={branches}
          onClose={() => {
            setIsModalOpen(false);
            setEditingUser(null);
            setError(null);
          }}
          onSubmit={handleSubmitUser}
          loading={formLoading}
        />

        {/* Modal de Vista */}
        {viewingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Detalles del Usuario
                </h2>
                <button
                  onClick={() => setViewingUser(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xl font-semibold text-blue-600 dark:text-blue-400">
                    {getInitials(viewingUser.full_name)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {viewingUser.full_name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-zinc-400">
                      @{viewingUser.username}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-500 dark:text-zinc-400">
                      Email
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {viewingUser.email}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-500 dark:text-zinc-400">
                      Rol
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {getRoleLabel(viewingUser.role)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-500 dark:text-zinc-400">
                      Sucursal
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {getBranchName(viewingUser.branch_id)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-500 dark:text-zinc-400">
                      Estado
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          viewingUser.status === "active"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : viewingUser.status === "inactive"
                            ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                            : viewingUser.is_locked
                            ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                        }`}
                      >
                        {viewingUser.status === "active"
                          ? "Activo"
                          : viewingUser.status === "inactive"
                          ? "Inactivo"
                          : viewingUser.is_locked
                          ? "Bloqueado"
                          : "Desconocido"}
                      </span>
                    </p>
                  </div>
                  {viewingUser.permissions &&
                    viewingUser.permissions.length > 0 && (
                      <div className="col-span-2">
                        <label className="text-sm font-semibold text-gray-500 dark:text-zinc-400">
                          Permisos
                        </label>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {viewingUser.permissions.map((permission, index) => (
                            <span
                              key={index}
                              className="inline-flex px-2 py-1 text-xs font-medium rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                            >
                              {permission}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  {viewingUser.last_login_at && (
                    <div>
                      <label className="text-sm font-semibold text-gray-500 dark:text-zinc-400">
                        Último inicio de sesión
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white mt-1">
                        {new Date(viewingUser.last_login_at).toLocaleString(
                          "es-MX"
                        )}
                      </p>
                    </div>
                  )}
                  {viewingUser.created_at && (
                    <div>
                      <label className="text-sm font-semibold text-gray-500 dark:text-zinc-400">
                        Fecha de creación
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white mt-1">
                        {new Date(viewingUser.created_at).toLocaleDateString(
                          "es-MX"
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
