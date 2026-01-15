"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Eye, Calendar, Clock, MapPin } from "lucide-react";
import { getAccessToken } from "@/src/lib/auth";
import { apiFetch } from "@/src/lib/api";
import type {
  Appointment,
  AppointmentsResponse,
  AppointmentCreateRequest,
  AppointmentCreateResponse,
} from "@/src/lib/types/appointment";
import type { Branch } from "@/src/lib/types/branch";
import type { Client } from "@/src/lib/types/client";
import type { Vehicle } from "@/src/lib/types/vehicle";
import AppointmentFormModal from "./components/AppointmentFormModal";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

export default function CitasPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<
    Appointment[]
  >([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewingAppointment, setViewingAppointment] =
    useState<Appointment | null>(null);

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
        // Mantener tanto _id como id normalizado para compatibilidad
        const normalizedBranches = response.data.map(
          (branch: Branch & { _id?: string }) => {
            const branchId = branch._id || branch.id || String(branch.code);
            return {
              ...branch,
              _id: branch._id || branchId, // Preservar _id original si existe
              id: branchId, // id normalizado para compatibilidad
            };
          }
        );
        setBranches(normalizedBranches);
      }
    } catch (err) {
      console.error("Error al cargar sucursales:", err);
    }
  }, []);

  // Cargar clientes
  const fetchClients = useCallback(async () => {
    try {
      const response = await apiFetch<{
        ok: boolean;
        message: string;
        data: Client[];
      }>("/clients", {
        method: "GET",
      });

      if (response.ok && Array.isArray(response.data)) {
        // Mantener _id original si existe
        const normalizedClients = response.data.map((client: Client) => ({
          ...client,
          id: client.id || client._id,
          // El _id ya viene en Client, no necesitamos normalizarlo
        }));
        setClients(normalizedClients);
      }
    } catch (err) {
      console.error("Error al cargar clientes:", err);
    }
  }, []);

  // Cargar vehículos
  const fetchVehicles = useCallback(async () => {
    try {
      const response = await apiFetch<{
        ok: boolean;
        message: string;
        data: Vehicle[];
      }>("/vehicles", {
        method: "GET",
      });

      if (response.ok && Array.isArray(response.data)) {
        // Mantener _id original si existe
        const normalizedVehicles = response.data.map((vehicle: Vehicle) => ({
          ...vehicle,
          id: vehicle.id || vehicle._id,
          // El _id ya viene en Vehicle, no necesitamos normalizarlo
        }));
        setVehicles(normalizedVehicles);
      }
    } catch (err) {
      console.error("Error al cargar vehículos:", err);
    }
  }, []);

  // Cargar citas
  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
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
        setFilteredAppointments(normalizedAppointments);
      } else {
        setError(response.message || "No se pudieron cargar las citas");
        setAppointments([]);
        setFilteredAppointments([]);
      }
    } catch (err) {
      console.error("Error al cargar citas:", err);
      const errorMessage =
        err && typeof err === "object" && "message" in err
          ? String(err.message)
          : "Error al cargar las citas. Por favor, intenta nuevamente.";
      setError(errorMessage);
      setAppointments([]);
      setFilteredAppointments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (getAccessToken()) {
      fetchAppointments();
      fetchBranches();
      fetchClients();
      fetchVehicles();
    }
  }, [fetchAppointments, fetchBranches, fetchClients, fetchVehicles]);

  // Filtrar citas
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredAppointments(appointments);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = appointments.filter((appointment) => {
      const client = clients.find(
        (c) => c._id === appointment.client_id || c.id === appointment.client_id
      );
      const vehicle = vehicles.find(
        (v) =>
          v._id === appointment.vehicle_id || v.id === appointment.vehicle_id
      );
      const branch = branches.find((b) => {
        const branchWithId = b as Branch & { _id?: string };
        return (
          branchWithId._id === appointment.branch_id ||
          b.id === appointment.branch_id
        );
      });

      return (
        appointment.sequence.toLowerCase().includes(term) ||
        (client && client.name.toLowerCase().includes(term)) ||
        (vehicle &&
          `${vehicle.brand} ${vehicle.model}`.toLowerCase().includes(term)) ||
        (vehicle && vehicle.license.toLowerCase().includes(term)) ||
        (branch && branch.name.toLowerCase().includes(term))
      );
    });
    setFilteredAppointments(filtered);
  }, [searchTerm, appointments, clients, vehicles, branches]);

  // Ver cita
  const handleViewAppointment = (appointment: Appointment) => {
    setViewingAppointment(appointment);
  };

  // Crear cita
  const handleSubmitAppointment = async (data: AppointmentCreateRequest) => {
    try {
      setFormLoading(true);
      setError(null);

      const response = await apiFetch<AppointmentCreateResponse>(
        "/appointments",
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      );

      if (response && response.ok && response.data) {
        await fetchAppointments();
        setIsModalOpen(false);
        setError(null);
      } else {
        const message = response?.message || "Error al crear la cita";
        throw new Error(message);
      }
    } catch (err) {
      console.error("Error al guardar cita:", err);

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
        errorMessage = "Error al crear la cita. Por favor, intenta nuevamente.";
      }

      setError(errorMessage);
      throw err;
    } finally {
      setFormLoading(false);
    }
  };

  // Helper functions
  const getClientName = (clientId: string): string => {
    const client = clients.find((c) => (c.id || c._id) === clientId);
    return client ? client.name : "Cliente no encontrado";
  };

  const getVehicleInfo = (vehicleId: string): string => {
    const vehicle = vehicles.find((v) => (v.id || v._id) === vehicleId);
    return vehicle
      ? `${vehicle.brand} ${vehicle.model} ${vehicle.year} - ${vehicle.license}`
      : "Vehículo no encontrado";
  };

  const getBranchName = (branchId: string): string => {
    const branch = branches.find((b) => {
      const branchWithId = b as Branch & { _id?: string };
      return branchWithId._id === branchId || b.id === branchId;
    });
    return branch ? branch.name : "Sucursal no encontrada";
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string): string => {
    const statusMap: Record<string, string> = {
      programado:
        "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
      confirmada:
        "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      "en servicio":
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      completada:
        "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
      cancelada: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    };
    return (
      statusMap[status.toLowerCase()] ||
      "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
    );
  };

  const getStatusLabel = (status: string): string => {
    const statusMap: Record<string, string> = {
      programado: "Pendiente",
      confirmada: "Confirmada",
      "en servicio": "En Servicio",
      completada: "Completada",
      cancelada: "Cancelada",
    };
    return statusMap[status.toLowerCase()] || status;
  };

  // Formatear y truncar tipos de servicio
  const formatServiceType = (serviceType: string, maxLength: number = 30): string => {
    if (!serviceType) return "-";
    
    // Reemplazar guiones bajos con espacios y capitalizar
    const formatted = serviceType
      .split(",")
      .map((service) => {
        return service
          .trim()
          .replace(/_/g, " ")
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(" ");
      })
      .join(", ");
    
    // Truncar si es muy largo
    if (formatted.length > maxLength) {
      return formatted.substring(0, maxLength) + "...";
    }
    
    return formatted;
  };

  // Obtener el texto completo formateado de los servicios
  const getFullServiceType = (serviceType: string): string => {
    if (!serviceType) return "-";
    
    return serviceType
      .split(",")
      .map((service) => {
        return service
          .trim()
          .replace(/_/g, " ")
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(" ");
      })
      .join(", ");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 transition-colors duration-300">
      <Sidebar />
      <Header />
      <main className="ml-60 pt-16 p-6">
        {/* Header Section */}
        <div className="mb-6">
          <h1 className="title-primary">Agendar Citas</h1>
          <p className="subtitle mt-1">
            Gestión centralizada de citas en todas las sucursales
          </p>
        </div>

        {/* Search and Action Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full sm:max-w-md">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-400">
              <Search size={20} />
            </div>
            <input
              type="text"
              placeholder="Buscar por cliente, folio o vehículo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-zinc-400 outline-none focus:ring-4 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-colors"
            />
          </div>
          <button
            onClick={() => {
              setIsModalOpen(true);
              setError(null);
            }}
            className="button-text w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            Nueva Cita
          </button>
        </div>

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
              <p className="label">Cargando citas...</p>
            </div>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 rounded-full bg-gray-100 dark:bg-zinc-800 mb-4">
              <Calendar
                size={48}
                className="text-gray-400 dark:text-zinc-500"
              />
            </div>
            <h3 className="card-title mb-2">
              {searchTerm
                ? "No se encontraron citas"
                : "No hay citas programadas"}
            </h3>
            <p className="label mb-6">
              {searchTerm
                ? "Intenta con otro término de búsqueda"
                : 'Crea tu primera cita haciendo clic en "Nueva Cita"'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => {
                  setIsModalOpen(true);
                  setError(null);
                }}
                className="button-text px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors flex items-center gap-2"
              >
                <Plus size={20} />
                Nueva Cita
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Citas Programadas
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-zinc-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-zinc-300 uppercase tracking-wider">
                      Folio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-zinc-300 uppercase tracking-wider">
                      Fecha y Hora
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-zinc-300 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-zinc-300 uppercase tracking-wider">
                      Vehículo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-zinc-300 uppercase tracking-wider max-w-xs">
                      Servicio
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
                  {filteredAppointments.map((appointment) => (
                    <tr
                      key={appointment.id || appointment._id}
                      className="hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {appointment.sequence}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar
                            size={16}
                            className="text-gray-400 dark:text-zinc-400"
                          />
                          <span className="text-sm text-gray-900 dark:text-white">
                            {formatDate(appointment.appointment_date)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock
                            size={16}
                            className="text-gray-400 dark:text-zinc-400"
                          />
                          <span className="text-sm text-gray-500 dark:text-zinc-400">
                            {formatTime(appointment.start_time)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {getClientName(appointment.client_id)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {getVehicleInfo(appointment.vehicle_id)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div 
                          className="text-sm text-gray-900 dark:text-white max-w-xs truncate"
                          title={getFullServiceType(appointment.appointment_type)}
                        >
                          {formatServiceType(appointment.appointment_type, 40)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <MapPin
                            size={16}
                            className="text-gray-400 dark:text-zinc-400"
                          />
                          <span className="text-sm text-gray-900 dark:text-white">
                            {getBranchName(appointment.branch_id)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            appointment.status
                          )}`}
                        >
                          {getStatusLabel(appointment.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewAppointment(appointment)}
                            className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors"
                            aria-label="Ver cita"
                          >
                            <Eye size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal de Formulario */}
        <AppointmentFormModal
          isOpen={isModalOpen}
          branches={branches}
          clients={clients}
          vehicles={vehicles}
          onClose={() => {
            setIsModalOpen(false);
            setError(null);
          }}
          onSubmit={handleSubmitAppointment}
          loading={formLoading}
        />

        {/* Modal de Vista */}
        {viewingAppointment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Detalles de la Cita
                </h2>
                <button
                  onClick={() => setViewingAppointment(null)}
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-500 dark:text-zinc-400">
                      Folio
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {viewingAppointment.sequence}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-500 dark:text-zinc-400">
                      Estado
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          viewingAppointment.status
                        )}`}
                      >
                        {getStatusLabel(viewingAppointment.status)}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-500 dark:text-zinc-400">
                      Fecha
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {formatDate(viewingAppointment.appointment_date)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-500 dark:text-zinc-400">
                      Hora
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {formatTime(viewingAppointment.start_time)} -{" "}
                      {formatTime(viewingAppointment.end_time)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-500 dark:text-zinc-400">
                      Cliente
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {getClientName(viewingAppointment.client_id)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-500 dark:text-zinc-400">
                      Vehículo
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {getVehicleInfo(viewingAppointment.vehicle_id)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-500 dark:text-zinc-400">
                      Tipo de Servicio
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {getFullServiceType(viewingAppointment.appointment_type)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-500 dark:text-zinc-400">
                      Sucursal
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {getBranchName(viewingAppointment.branch_id)}
                    </p>
                  </div>
                  {viewingAppointment.notes && (
                    <div className="col-span-2">
                      <label className="text-sm font-semibold text-gray-500 dark:text-zinc-400">
                        Notas
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white mt-1">
                        {viewingAppointment.notes}
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
