"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  User,
  Building2,
  Eye,
  Pencil,
  Trash2,
  Car,
} from "lucide-react";
import { getAccessToken } from "@/src/lib/auth";
import { apiFetch } from "@/src/lib/api";
import type {
  Client,
  ClientsResponse,
  ClientCreateRequest,
  ClientCreateResponse,
  ClientUpdateRequest,
} from "@/src/lib/types/client";
import type {
  Vehicle,
  VehiclesResponse,
  VehicleCreateRequest,
  VehicleCreateResponse,
  VehicleUpdateRequest,
} from "@/src/lib/types/vehicle";
import type { Branch, BranchesResponse } from "@/src/lib/types/branch";
import ClientFormModal from "./components/ClientFormModal";
import VehicleFormModal from "./components/VehicleFormModal";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

type TabType = "clientes" | "vehiculos";

export default function ClientesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("clientes");

  // Estados para clientes
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);

  // Estados para vehículos
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [viewingVehicle, setViewingVehicle] = useState<Vehicle | null>(null);

  // Estados para sucursales
  const [branches, setBranches] = useState<Branch[]>([]);

  // Estados compartidos
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar autenticación
  useEffect(() => {
    if (!getAccessToken()) {
      router.replace("/login");
    }
  }, [router]);

  // Cargar clientes
  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiFetch<ClientsResponse>("/clients", {
        method: "GET",
      });

      if (response.ok && Array.isArray(response.data)) {
        // Normalizar los clientes para asegurar que tengan id y zipcode
        const normalizedClients = response.data.map(
          (client: Client & { zipCode?: string }) => ({
            ...client,
            id: client.id || client._id,
            zipcode: client.zipcode || client.zipCode || "", // Normalizar zipCode a zipcode
          })
        );

        setClients(normalizedClients);
        setFilteredClients(normalizedClients);
      } else {
        setError(response.message || "No se pudieron cargar los clientes");
        setClients([]);
        setFilteredClients([]);
      }
    } catch (err) {
      console.error("Error al cargar clientes:", err);
      const errorMessage =
        err && typeof err === "object" && "message" in err
          ? String(err.message)
          : "Error al cargar los clientes. Por favor, intenta nuevamente.";
      setError(errorMessage);
      setClients([]);
      setFilteredClients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar vehículos
  const fetchVehicles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiFetch<VehiclesResponse>("/vehicles", {
        method: "GET",
      });

      if (response.ok && Array.isArray(response.data)) {
        // Normalizar los vehículos para asegurar que tengan id
        const normalizedVehicles = response.data.map((vehicle: Vehicle) => ({
          ...vehicle,
          id: vehicle.id || vehicle._id,
        }));

        setVehicles(normalizedVehicles);
        setFilteredVehicles(normalizedVehicles);
      } else {
        setError(response.message || "No se pudieron cargar los vehículos");
        setVehicles([]);
        setFilteredVehicles([]);
      }
    } catch (err) {
      console.error("Error al cargar vehículos:", err);
      const errorMessage =
        err && typeof err === "object" && "message" in err
          ? String(err.message)
          : "Error al cargar los vehículos. Por favor, intenta nuevamente.";
      setError(errorMessage);
      setVehicles([]);
      setFilteredVehicles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar sucursales
  const fetchBranches = useCallback(async () => {
    try {
      const response = await apiFetch<BranchesResponse>("/branches", {
        method: "GET",
      });

      if (response.ok && Array.isArray(response.data)) {
        // Normalizar las sucursales para asegurar que tengan id
        const normalizedBranches = response.data.map(
          (branch: Branch & { _id?: string }) => ({
            ...branch,
            id: branch.id || branch._id || branch.code,
          })
        );
        setBranches(normalizedBranches);
      }
    } catch (err) {
      console.error("Error al cargar sucursales:", err);
    }
  }, []);

  useEffect(() => {
    if (getAccessToken()) {
      fetchClients();
      fetchVehicles();
      fetchBranches();
    }
  }, [fetchClients, fetchVehicles, fetchBranches]);

  // Filtrar clientes por nombre, email, taxId, etc.
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredClients(clients);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = clients.filter(
      (client) =>
        client.name.toLowerCase().includes(term) ||
        client.email.toLowerCase().includes(term) ||
        client.taxId.toLowerCase().includes(term) ||
        (client.phone && client.phone.includes(term))
    );
    setFilteredClients(filtered);
  }, [searchTerm, clients]);

  // Filtrar vehículos por placas, VIN, modelo, marca, etc.
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredVehicles(vehicles);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = vehicles.filter((vehicle) => {
      const client = clients.find((c) => (c.id || c._id) === vehicle.client_id);
      return (
        vehicle.license.toLowerCase().includes(term) ||
        vehicle.vin.toLowerCase().includes(term) ||
        vehicle.model.toLowerCase().includes(term) ||
        vehicle.brand.toLowerCase().includes(term) ||
        vehicle.economico.toLowerCase().includes(term) ||
        (client && client.name.toLowerCase().includes(term))
      );
    });
    setFilteredVehicles(filtered);
  }, [searchTerm, vehicles, clients]);

  // Ver cliente
  const handleViewClient = (client: Client) => {
    setViewingClient(client);
  };

  // Editar cliente
  const handleEditClient = (client: Client) => {
    if (!client.id && !client._id) {
      setError("Error: El cliente no tiene un ID válido");
      return;
    }
    setEditingClient(client);
    setIsClientModalOpen(true);
    setError(null);
  };

  // Crear o actualizar cliente
  const handleSubmitClient = async (
    data: ClientCreateRequest | ClientUpdateRequest
  ) => {
    try {
      setFormLoading(true);
      setError(null);

      if (editingClient) {
        // Validar que el cliente tenga un ID
        const clientId = editingClient.id || editingClient._id;
        if (!clientId) {
          throw new Error("El cliente no tiene un ID válido para actualizar");
        }

        // Actualizar cliente existente
        const response = await apiFetch<ClientCreateResponse>(
          `/clients/${clientId}`,
          {
            method: "PATCH",
            body: JSON.stringify(data),
          }
        );

        if (response && response.ok && response.data) {
          await fetchClients();
          setIsClientModalOpen(false);
          setEditingClient(null);
          setError(null);
        } else {
          const message = response?.message || "Error al actualizar el cliente";
          throw new Error(message);
        }
      } else {
        // Crear nuevo cliente
        console.log("Datos a enviar al crear cliente:", data);
        const response = await apiFetch<ClientCreateResponse>("/clients", {
          method: "POST",
          body: JSON.stringify(data),
        });

        if (response && response.ok && response.data) {
          await fetchClients();
          setIsClientModalOpen(false);
          setEditingClient(null);
          setError(null);
        } else {
          const message = response?.message || "Error al crear el cliente";
          throw new Error(message);
        }
      }
    } catch (err) {
      console.error("Error al guardar cliente:", err);
      console.error(
        "Detalles completos del error:",
        JSON.stringify(err, null, 2)
      );

      let errorMessage = "Error desconocido. Por favor, intenta nuevamente.";

      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (err && typeof err === "object") {
        const apiErr = err as {
          message?: string;
          status?: number;
          details?: unknown;
        };

        console.log("ApiError extraído:", apiErr);

        // Intentar extraer el mensaje de diferentes formas
        if (apiErr.details) {
          console.log("Details del error:", apiErr.details);

          // Si details es un objeto con message
          if (typeof apiErr.details === "object") {
            const details = apiErr.details as {
              message?: string;
              error?: string;
              [key: string]: unknown;
            };

            // Intentar message primero
            if (details.message && typeof details.message === "string") {
              errorMessage = details.message;
            }
            // Luego intentar error
            else if (details.error && typeof details.error === "string") {
              errorMessage = details.error;
            }
            // Si hay un array de errores (validación)
            else if (Array.isArray(details.errors)) {
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
            // Si es un string directamente
            else if (typeof details === "string") {
              errorMessage = details;
            }
          }
          // Si details es un string directamente
          else if (typeof apiErr.details === "string") {
            errorMessage = apiErr.details;
          }
        }

        // Si aún no tenemos un mensaje, usar el message del error
        if (
          errorMessage ===
            "Error desconocido. Por favor, intenta nuevamente." &&
          apiErr.message
        ) {
          errorMessage = apiErr.message;
        }

        // Agregar el status code si está disponible
        if (apiErr.status && errorMessage) {
          errorMessage = `Error ${apiErr.status}: ${errorMessage}`;
        }
      }

      if (
        errorMessage === "Error desconocido. Por favor, intenta nuevamente."
      ) {
        errorMessage = editingClient
          ? "Error al actualizar el cliente. Por favor, intenta nuevamente."
          : "Error al crear el cliente. Por favor, intenta nuevamente.";
      }

      setError(errorMessage);
      throw err;
    } finally {
      setFormLoading(false);
    }
  };

  // Ver vehículo
  const handleViewVehicle = (vehicle: Vehicle) => {
    setViewingVehicle(vehicle);
  };

  // Editar vehículo
  const handleEditVehicle = (vehicle: Vehicle) => {
    if (!vehicle.id && !vehicle._id) {
      setError("Error: El vehículo no tiene un ID válido");
      return;
    }
    setEditingVehicle(vehicle);
    setIsVehicleModalOpen(true);
    setError(null);
  };

  // Crear o actualizar vehículo
  const handleSubmitVehicle = async (
    data: VehicleCreateRequest | VehicleUpdateRequest
  ) => {
    try {
      setFormLoading(true);
      setError(null);

      if (editingVehicle) {
        // Validar que el vehículo tenga un ID
        const vehicleId = editingVehicle.id || editingVehicle._id;
        if (!vehicleId) {
          throw new Error("El vehículo no tiene un ID válido para actualizar");
        }

        // Actualizar vehículo existente
        const response = await apiFetch<VehicleCreateResponse>(
          `/vehicles/${vehicleId}`,
          {
            method: "PATCH",
            body: JSON.stringify(data),
          }
        );

        if (response && response.ok && response.data) {
          await fetchVehicles();
          setIsVehicleModalOpen(false);
          setEditingVehicle(null);
          setError(null);
        } else {
          const message =
            response?.message || "Error al actualizar el vehículo";
          throw new Error(message);
        }
      } else {
        // Crear nuevo vehículo
        const response = await apiFetch<VehicleCreateResponse>("/vehicles", {
          method: "POST",
          body: JSON.stringify(data),
        });

        if (response && response.ok && response.data) {
          await fetchVehicles();
          setIsVehicleModalOpen(false);
          setEditingVehicle(null);
          setError(null);
        } else {
          const message = response?.message || "Error al crear el vehículo";
          throw new Error(message);
        }
      }
    } catch (err) {
      console.error("Error al guardar vehículo:", err);

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
            } else if (typeof details === "string") {
              errorMessage = details;
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
        errorMessage = editingVehicle
          ? "Error al actualizar el vehículo. Por favor, intenta nuevamente."
          : "Error al crear el vehículo. Por favor, intenta nuevamente.";
      }

      setError(errorMessage);
      throw err;
    } finally {
      setFormLoading(false);
    }
  };

  // Obtener nombre del cliente por ID
  const getClientName = (clientId: string): string => {
    const client = clients.find((c) => (c.id || c._id) === clientId);
    return client ? client.name : "Cliente no encontrado";
  };

  // Determinar si es empresa o persona física basado en legalName
  const getClientType = (client: Client): "Empresa" | "Persona Física" => {
    return client.legalName && client.legalName.trim() !== ""
      ? "Empresa"
      : "Persona Física";
  };

  // Obtener estado del vehículo desde metadata
  const getVehicleStatus = (vehicle: Vehicle): string => {
    try {
      if (vehicle.metadata) {
        const metadata = JSON.parse(vehicle.metadata);
        return metadata.estadoDelVehiculo || "Activo";
      }
    } catch {
      // Si hay error parseando, retornar por defecto
    }
    return "Activo";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 transition-colors duration-300">
      <Sidebar />
      <Header />
      <main className="ml-60 pt-16 p-6">
        {/* Header Section */}
        <div className="mb-6">
          <h1 className="title-primary">Clientes y Vehículos</h1>
          <p className="subtitle mt-1">
            Gestión completa de clientes, vehículos y su historial de servicios
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
              placeholder={
                activeTab === "clientes"
                  ? "Buscar por nombre, RFC, email..."
                  : "Buscar por placas, VIN, modelo, marca..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-zinc-400 outline-none focus:ring-4 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-colors"
            />
          </div>
          <button
            onClick={() => {
              if (activeTab === "clientes") {
                setEditingClient(null);
                setIsClientModalOpen(true);
              } else {
                setEditingVehicle(null);
                setIsVehicleModalOpen(true);
              }
              setError(null);
            }}
            className="button-text w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            {activeTab === "clientes" ? "Nuevo Cliente" : "Nuevo Vehículo"}
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-gray-200 dark:border-zinc-800">
          <button
            onClick={() => {
              setActiveTab("clientes");
              setSearchTerm("");
            }}
            className={`px-4 py-2 border-b-2 font-semibold flex items-center gap-2 transition-colors ${
              activeTab === "clientes"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300"
            }`}
          >
            <User size={18} />
            Clientes
          </button>
          <button
            onClick={() => {
              setActiveTab("vehiculos");
              setSearchTerm("");
            }}
            className={`px-4 py-2 border-b-2 font-semibold flex items-center gap-2 transition-colors ${
              activeTab === "vehiculos"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300"
            }`}
          >
            <Car size={18} />
            Vehículos
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
              <p className="label">
                Cargando {activeTab === "clientes" ? "clientes" : "vehículos"}
                ...
              </p>
            </div>
          </div>
        ) : activeTab === "clientes" ? (
          filteredClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 rounded-full bg-gray-100 dark:bg-zinc-800 mb-4">
                <User size={48} className="text-gray-400 dark:text-zinc-500" />
              </div>
              <h3 className="card-title mb-2">
                {searchTerm
                  ? "No se encontraron clientes"
                  : "No hay clientes registrados"}
              </h3>
              <p className="label mb-6">
                {searchTerm
                  ? "Intenta con otro término de búsqueda"
                  : 'Crea tu primer cliente haciendo clic en "Nuevo Cliente"'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => {
                    setEditingClient(null);
                    setIsClientModalOpen(true);
                    setError(null);
                  }}
                  className="button-text px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors flex items-center gap-2"
                >
                  <Plus size={20} />
                  Nuevo Cliente
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Lista de Clientes
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-zinc-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-zinc-300 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-zinc-300 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-zinc-300 uppercase tracking-wider">
                        RFC
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-zinc-300 uppercase tracking-wider">
                        Contacto
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
                    {filteredClients.map((client) => {
                      const clientType = getClientType(client);
                      return (
                        <tr
                          key={client.id || client._id}
                          className="hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              {clientType === "Empresa" ? (
                                <Building2
                                  size={20}
                                  className="text-gray-400 dark:text-zinc-400"
                                />
                              ) : (
                                <User
                                  size={20}
                                  className="text-gray-400 dark:text-zinc-400"
                                />
                              )}
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {client.name}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-zinc-400">
                                  {client.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900 dark:text-white">
                              {clientType}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900 dark:text-white">
                              {client.taxId}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900 dark:text-white">
                              {client.phone}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                client.isActive
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                  : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                              }`}
                            >
                              {client.isActive ? "Activo" : "Inactivo"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleViewClient(client)}
                                className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors"
                                aria-label="Ver cliente"
                              >
                                <Eye size={18} />
                              </button>
                              <button
                                onClick={() => handleEditClient(client)}
                                className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors"
                                aria-label="Editar cliente"
                              >
                                <Pencil size={18} />
                              </button>
                              <button
                                className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors"
                                aria-label="Eliminar cliente"
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
          )
        ) : filteredVehicles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 rounded-full bg-gray-100 dark:bg-zinc-800 mb-4">
              <Car size={48} className="text-gray-400 dark:text-zinc-500" />
            </div>
            <h3 className="card-title mb-2">
              {searchTerm
                ? "No se encontraron vehículos"
                : "No hay vehículos registrados"}
            </h3>
            <p className="label mb-6">
              {searchTerm
                ? "Intenta con otro término de búsqueda"
                : 'Crea tu primer vehículo haciendo clic en "Nuevo Vehículo"'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => {
                  setEditingVehicle(null);
                  setIsVehicleModalOpen(true);
                  setError(null);
                }}
                className="button-text px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors flex items-center gap-2"
              >
                <Plus size={20} />
                Nuevo Vehículo
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Lista de Vehículos
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-zinc-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-zinc-300 uppercase tracking-wider">
                      Vehículo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-zinc-300 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-zinc-300 uppercase tracking-wider">
                      Placas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-zinc-300 uppercase tracking-wider">
                      VIN
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-zinc-300 uppercase tracking-wider">
                      Año
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-zinc-300 uppercase tracking-wider">
                      Odómetro
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
                  {filteredVehicles.map((vehicle) => (
                    <tr
                      key={vehicle.id || vehicle._id}
                      className="hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <Car
                            size={20}
                            className="text-gray-400 dark:text-zinc-400"
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {vehicle.brand} {vehicle.model}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-zinc-400">
                              {vehicle.tipo} - {vehicle.fuelType}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {getClientName(vehicle.client_id)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {vehicle.license}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 dark:text-white font-mono">
                          {vehicle.vin}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {vehicle.year}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {vehicle.odometer.toLocaleString()} km
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(() => {
                          const status = getVehicleStatus(vehicle);
                          const statusConfig: Record<
                            string,
                            {
                              bg: string;
                              text: string;
                              darkBg: string;
                              darkText: string;
                            }
                          > = {
                            Activo: {
                              bg: "bg-green-100",
                              text: "text-green-800",
                              darkBg: "dark:bg-green-900/30",
                              darkText: "dark:text-green-400",
                            },
                            "En Servicio": {
                              bg: "bg-blue-100",
                              text: "text-blue-800",
                              darkBg: "dark:bg-blue-900/30",
                              darkText: "dark:text-blue-400",
                            },
                            "Dado de Baja": {
                              bg: "bg-red-100",
                              text: "text-red-800",
                              darkBg: "dark:bg-red-900/30",
                              darkText: "dark:text-red-400",
                            },
                          };
                          const config =
                            statusConfig[status] || statusConfig["Activo"];
                          return (
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text} ${config.darkBg} ${config.darkText}`}
                            >
                              {status}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewVehicle(vehicle)}
                            className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors"
                            aria-label="Ver vehículo"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => handleEditVehicle(vehicle)}
                            className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors"
                            aria-label="Editar vehículo"
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors"
                            aria-label="Eliminar vehículo"
                          >
                            <Trash2 size={18} />
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

        {/* Modal de Formulario de Cliente */}
        <ClientFormModal
          isOpen={isClientModalOpen}
          client={editingClient}
          onClose={() => {
            setIsClientModalOpen(false);
            setEditingClient(null);
            setError(null);
          }}
          onSubmit={handleSubmitClient}
          loading={formLoading}
        />

        {/* Modal de Formulario de Vehículo */}
        <VehicleFormModal
          isOpen={isVehicleModalOpen}
          vehicle={editingVehicle}
          clients={clients}
          branches={branches}
          onClose={() => {
            setIsVehicleModalOpen(false);
            setEditingVehicle(null);
            setError(null);
          }}
          onSubmit={handleSubmitVehicle}
          loading={formLoading}
        />

        {/* Modal de Vista de Cliente */}
        {viewingClient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Detalles del Cliente
                </h2>
                <button
                  onClick={() => setViewingClient(null)}
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
                      {getClientType(viewingClient) === "Empresa"
                        ? "Razón Social"
                        : "Nombre Completo"}
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {viewingClient.name}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-500 dark:text-zinc-400">
                      Email
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {viewingClient.email}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-500 dark:text-zinc-400">
                      Teléfono
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {viewingClient.phone}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-500 dark:text-zinc-400">
                      RFC
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {viewingClient.taxId}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-500 dark:text-zinc-400">
                      Dirección
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {viewingClient.address}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-500 dark:text-zinc-400">
                      Ciudad
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {viewingClient.city}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-500 dark:text-zinc-400">
                      Estado
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {viewingClient.state}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-500 dark:text-zinc-400">
                      Código Postal
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {viewingClient.zipcode}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-500 dark:text-zinc-400">
                      Contacto Preferido
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {viewingClient.preferredContact}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-500 dark:text-zinc-400">
                      Email de Facturación
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {viewingClient.billingEmail}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-500 dark:text-zinc-400">
                      Estado
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          viewingClient.isActive
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {viewingClient.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Vista de Vehículo */}
        {viewingVehicle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Detalles del Vehículo
                </h2>
                <button
                  onClick={() => setViewingVehicle(null)}
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
                      Cliente
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {getClientName(viewingVehicle.client_id)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-500 dark:text-zinc-400">
                      Económico
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {viewingVehicle.economico}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-500 dark:text-zinc-400">
                      Placas
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {viewingVehicle.license}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-500 dark:text-zinc-400">
                      VIN
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1 font-mono">
                      {viewingVehicle.vin}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-500 dark:text-zinc-400">
                      Marca
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {viewingVehicle.brand}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-500 dark:text-zinc-400">
                      Modelo
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {viewingVehicle.model}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-500 dark:text-zinc-400">
                      Año
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {viewingVehicle.year}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-500 dark:text-zinc-400">
                      Tipo
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {viewingVehicle.tipo}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-500 dark:text-zinc-400">
                      Tipo de Combustible
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {viewingVehicle.fuelType}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-500 dark:text-zinc-400">
                      Odómetro
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {viewingVehicle.odometer.toLocaleString()} km
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-500 dark:text-zinc-400">
                      Flota
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          viewingVehicle.fleet
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                        }`}
                      >
                        {viewingVehicle.fleet ? "Sí" : "No"}
                      </span>
                    </p>
                  </div>
                  {viewingVehicle.projectId && (
                    <div>
                      <label className="text-sm font-semibold text-gray-500 dark:text-zinc-400">
                        ID de Proyecto
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white mt-1">
                        {viewingVehicle.projectId}
                      </p>
                    </div>
                  )}
                  {viewingVehicle.advisor && (
                    <div>
                      <label className="text-sm font-semibold text-gray-500 dark:text-zinc-400">
                        Asesor
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white mt-1">
                        {viewingVehicle.advisor}
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
