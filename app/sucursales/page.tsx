"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Building2 } from "lucide-react";
import { getAccessToken } from "@/src/lib/auth";
import { apiFetch } from "@/src/lib/api";
import type {
  Branch,
  BranchesResponse,
  BranchCreateRequest,
  BranchCreateResponse,
  BranchUpdateRequest,
  BranchDeleteResponse,
} from "@/src/lib/types/branch";
import type {
  Appointment,
  AppointmentsResponse,
} from "@/src/lib/types/appointment";
import BranchCard from "./components/BranchCard";
import BranchFormModal from "./components/BranchFormModal";
import DeleteConfirmModal from "./components/DeleteConfirmModal";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

export default function SucursalesPage() {
  const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [filteredBranches, setFilteredBranches] = useState<Branch[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deletingBranchId, setDeletingBranchId] = useState<string | null>(null);
  const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Verificar autenticación
  useEffect(() => {
    if (!getAccessToken()) {
      router.replace("/login");
    }
  }, [router]);

  // Cargar sucursales
  const fetchBranches = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiFetch<BranchesResponse>("/branches", {
        method: "GET",
      });

      if (response.ok && Array.isArray(response.data)) {
        // Log para verificar la estructura de los branches
        console.log("Branches cargados desde API:", response.data);
        if (response.data.length > 0) {
          console.log("Primer branch ejemplo:", response.data[0]);
          console.log("ID del primer branch:", response.data[0].id);
          console.log(
            "Todas las keys del primer branch:",
            Object.keys(response.data[0])
          );
        }

        // Normalizar los branches para asegurar que tengan id
        const normalizedBranches = response.data.map(
          (branch: Branch & { _id?: string; ID?: string }) => ({
            ...branch,
            id: branch.id || branch._id || branch.ID || String(branch.code), // Fallback a code si no hay id
          })
        );

        setBranches(normalizedBranches);
        setFilteredBranches(normalizedBranches);
      } else {
        setError(response.message || "No se pudieron cargar las sucursales");
        setBranches([]);
        setFilteredBranches([]);
      }
    } catch (err) {
      console.error("Error al cargar sucursales:", err);
      const errorMessage =
        err && typeof err === "object" && "message" in err
          ? String(err.message)
          : "Error al cargar las sucursales. Por favor, intenta nuevamente.";
      setError(errorMessage);
      setBranches([]);
      setFilteredBranches([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar citas
  const fetchAppointments = useCallback(async () => {
    try {
      const response = await apiFetch<AppointmentsResponse>("/appointments", {
        method: "GET",
      });

      if (response.ok && Array.isArray(response.data)) {
        const normalizedAppointments = response.data.map(
          (appointment: Appointment) => ({
            ...appointment,
            id: appointment.id || appointment._id,
          })
        );
        setAppointments(normalizedAppointments);
      }
    } catch (err) {
      console.error("Error al cargar citas:", err);
      // No mostrar error al usuario, solo loggear
      setAppointments([]);
    }
  }, []);

  // Obtener conteo de citas por sucursal para el mes actual
  const getAppointmentsCountForBranch = useCallback(
    (branchId: string): number => {
      if (!appointments.length || !branchId) return 0;

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      return appointments.filter((appointment) => {
        // Obtener el branch_id de la cita (puede ser string o objeto)
        let appointmentBranchId: string | null = null;

        if (typeof appointment.branch_id === "string") {
          appointmentBranchId = appointment.branch_id;
        } else if (
          appointment.branch_id &&
          typeof appointment.branch_id === "object"
        ) {
          appointmentBranchId =
            (appointment.branch_id as any)._id ||
            (appointment.branch_id as any).id;
        } else if ((appointment as any).branch) {
          const branch = (appointment as any).branch;
          appointmentBranchId = branch._id || branch.id || branch.ID;
        }

        // Comparar IDs (normalizar ambos)
        const normalizedBranchId = branchId.toString();
        const normalizedAppointmentBranchId = appointmentBranchId?.toString();

        if (!normalizedAppointmentBranchId) return false;
        if (normalizedAppointmentBranchId !== normalizedBranchId) return false;

        // Filtrar por mes actual
        if (appointment.appointment_date) {
          try {
            const appointmentDate = new Date(appointment.appointment_date);
            return (
              appointmentDate.getMonth() === currentMonth &&
              appointmentDate.getFullYear() === currentYear
            );
          } catch {
            return false;
          }
        }

        return false;
      }).length;
    },
    [appointments]
  );

  useEffect(() => {
    if (getAccessToken()) {
      fetchBranches();
      fetchAppointments();
    }
  }, [fetchBranches, fetchAppointments]);

  // Filtrar sucursales por nombre
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredBranches(branches);
      return;
    }

    const filtered = branches.filter((branch) =>
      branch.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredBranches(filtered);
  }, [searchTerm, branches]);

  // Editar sucursal
  const handleEditBranch = (branch: Branch) => {
    console.log("handleEditBranch llamado con:", branch);
    if (!branch.id) {
      console.error("El branch no tiene id:", branch);
      setError("Error: La sucursal no tiene un ID válido");
      return;
    }
    setEditingBranch(branch);
    setIsModalOpen(true);
    setError(null);
  };

  // Crear o actualizar sucursal
  const handleSubmitBranch = async (
    data: BranchCreateRequest | BranchUpdateRequest
  ) => {
    try {
      setFormLoading(true);
      setError(null);

      if (editingBranch) {
        // Validar que el branch tenga un ID
        if (!editingBranch.id) {
          throw new Error("La sucursal no tiene un ID válido para actualizar");
        }

        // Actualizar sucursal existente
        console.log(
          "Actualizando sucursal - editingBranch completo:",
          editingBranch
        );
        console.log("ID de la sucursal:", editingBranch.id);
        console.log("Datos a enviar:", data);

        const response = await apiFetch<BranchCreateResponse>(
          `/branches/${editingBranch.id}`,
          {
            method: "PATCH",
            body: JSON.stringify(data),
          }
        );

        console.log("Respuesta del PATCH:", response);

        if (response && response.ok && response.data) {
          await fetchBranches();
          await fetchAppointments();
          setIsModalOpen(false);
          setEditingBranch(null);
          setError(null);
        } else {
          const message =
            response?.message || "Error al actualizar la sucursal";
          throw new Error(message);
        }
      } else {
        // Crear nueva sucursal
        const response = await apiFetch<BranchCreateResponse>("/branches", {
          method: "POST",
          body: JSON.stringify(data),
        });

        if (response && response.ok && response.data) {
          await fetchBranches();
          await fetchAppointments();
          setIsModalOpen(false);
          setEditingBranch(null);
          setError(null);
        } else {
          const message = response?.message || "Error al crear la sucursal";
          throw new Error(message);
        }
      }
    } catch (err) {
      console.error("Error al guardar sucursal:", err);

      // Manejar diferentes tipos de errores
      let errorMessage = "Error desconocido. Por favor, intenta nuevamente.";

      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (err && typeof err === "object") {
        // Manejar ApiError del apiFetch
        const apiErr = err as {
          message?: string;
          status?: number;
          details?: unknown;
        };

        if (apiErr.message) {
          errorMessage = apiErr.message;
        } else if (apiErr.details && typeof apiErr.details === "object") {
          // Intentar extraer mensaje de details
          const details = apiErr.details as {
            message?: string;
            [key: string]: unknown;
          };
          if (details.message && typeof details.message === "string") {
            errorMessage = details.message;
          } else if (apiErr.status) {
            errorMessage = `Error ${apiErr.status}: ${errorMessage}`;
          }
        }
      }

      if (
        errorMessage === "Error desconocido. Por favor, intenta nuevamente."
      ) {
        errorMessage = editingBranch
          ? "Error al actualizar la sucursal. Por favor, intenta nuevamente."
          : "Error al crear la sucursal. Por favor, intenta nuevamente.";
      }

      setError(errorMessage);
      throw err; // Re-lanzar para que el modal pueda manejar el error
    } finally {
      setFormLoading(false);
    }
  };

  // Abrir modal de confirmación para eliminar
  const handleDeleteClick = (branch: Branch) => {
    setBranchToDelete(branch);
    setError(null);
  };

  // Cancelar eliminación
  const handleCancelDelete = () => {
    setBranchToDelete(null);
  };

  // Confirmar y eliminar sucursal
  const handleConfirmDelete = async () => {
    if (!branchToDelete || !branchToDelete.id) {
      setError("Error: La sucursal no tiene un ID válido");
      setBranchToDelete(null);
      return;
    }

    try {
      setDeletingBranchId(branchToDelete.id);
      setError(null);

      const response = await apiFetch<BranchDeleteResponse>(
        `/branches/${branchToDelete.id}`,
        {
          method: "DELETE",
        }
      );

      if (response && response.ok) {
        // Recargar la lista de sucursales y citas
        await fetchBranches();
        await fetchAppointments();
        setError(null);
        setBranchToDelete(null);
      } else {
        const message = response?.message || "Error al eliminar la sucursal";
        throw new Error(message);
      }
    } catch (err) {
      console.error("Error al eliminar sucursal:", err);

      let errorMessage =
        "Error al eliminar la sucursal. Por favor, intenta nuevamente.";

      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (err && typeof err === "object") {
        const apiErr = err as {
          message?: string;
          status?: number;
          details?: unknown;
        };

        if (apiErr.message) {
          errorMessage = apiErr.message;
        } else if (apiErr.details && typeof apiErr.details === "object") {
          const details = apiErr.details as {
            message?: string;
            [key: string]: unknown;
          };
          if (details.message && typeof details.message === "string") {
            errorMessage = details.message;
          } else if (apiErr.status) {
            errorMessage = `Error ${apiErr.status}: ${errorMessage}`;
          }
        }
      }

      setError(errorMessage);
    } finally {
      setDeletingBranchId(null);
    }
  };

  // Obtener color de la sucursal desde metadata o usar rotación por defecto
  const getAccentColor = (
    branch: Branch,
    index: number
  ): "blue" | "purple" | "green" => {
    // Intentar obtener el color del metadata
    try {
      if (branch.metadata) {
        const metadata = JSON.parse(branch.metadata);
        if (metadata.color) {
          // Convertir hex color a nombre de color aproximado
          const colorHex = metadata.color.toLowerCase();
          if (
            colorHex.startsWith("#2563eb") ||
            colorHex.startsWith("#3b82f6") ||
            colorHex.includes("blue")
          ) {
            return "blue";
          }
          if (
            colorHex.startsWith("#9333ea") ||
            colorHex.startsWith("#a855f7") ||
            colorHex.includes("purple")
          ) {
            return "purple";
          }
          if (
            colorHex.startsWith("#22c55e") ||
            colorHex.startsWith("#10b981") ||
            colorHex.includes("green")
          ) {
            return "green";
          }
        }
      }
    } catch {
      // Si no se puede parsear el metadata, continuar con rotación
    }

    // Rotación por defecto
    const colors: Array<"blue" | "purple" | "green"> = [
      "blue",
      "purple",
      "green",
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 transition-colors duration-300">
      <Sidebar />
      <Header />
      <main className="ml-60 pt-16">
        {/* Header Section */}
        <div className="px-8 pt-8 pb-6">
          <h1 className="title-primary mb-2">Gestión de Sucursales</h1>
          <p className="subtitle">
            Administra todas las sucursales de la red Carsistem Performance
          </p>
        </div>

        {/* Search and Action Bar */}
        <div className="px-8 mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full sm:max-w-md">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-400">
              <Search size={20} />
            </div>
            <input
              type="text"
              placeholder="Buscar por nombre, ciudad o gerente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-zinc-400 outline-none focus:ring-4 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-colors"
            />
          </div>
          <button
            onClick={() => {
              setEditingBranch(null);
              setIsModalOpen(true);
              setError(null);
            }}
            className="button-text w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            Nueva Sucursal
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="px-8 mb-6">
            <div className="rounded-xl border border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
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
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="px-8 flex items-center justify-center py-12">
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
              <p className="label">Cargando sucursales...</p>
            </div>
          </div>
        ) : filteredBranches.length === 0 ? (
          <div className="px-8 flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 rounded-full bg-gray-100 dark:bg-zinc-800 mb-4">
              <Building2
                size={48}
                className="text-gray-400 dark:text-zinc-500"
              />
            </div>
            <h3 className="card-title mb-2">
              {searchTerm
                ? "No se encontraron sucursales"
                : "No hay sucursales registradas"}
            </h3>
            <p className="label mb-6">
              {searchTerm
                ? "Intenta con otro término de búsqueda"
                : 'Crea tu primera sucursal haciendo clic en "Nueva Sucursal"'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => {
                  setEditingBranch(null);
                  setIsModalOpen(true);
                  setError(null);
                }}
                className="button-text px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors flex items-center gap-2"
              >
                <Plus size={20} />
                Nueva Sucursal
              </button>
            )}
          </div>
        ) : (
          <div className="px-8 pb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBranches.map((branch, index) => (
                <BranchCard
                  key={branch.id || `branch-${index}`}
                  branch={branch}
                  accentColor={getAccentColor(branch, index)}
                  onEdit={() => handleEditBranch(branch)}
                  onDelete={() => handleDeleteClick(branch)}
                  isDeleting={deletingBranchId === branch.id}
                  appointmentsCount={getAppointmentsCountForBranch(
                    branch.id || (branch as any)._id || branch.code || ""
                  )}
                />
              ))}
            </div>
          </div>
        )}

        {/* Modal de Formulario */}
        <BranchFormModal
          isOpen={isModalOpen}
          branch={editingBranch}
          onClose={() => {
            setIsModalOpen(false);
            setEditingBranch(null);
            setError(null);
          }}
          onSubmit={handleSubmitBranch}
          loading={formLoading}
        />

        {/* Modal de Confirmación de Eliminación */}
        <DeleteConfirmModal
          isOpen={!!branchToDelete}
          branchName={branchToDelete?.name || ""}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          isDeleting={!!deletingBranchId}
        />
      </main>
    </div>
  );
}
