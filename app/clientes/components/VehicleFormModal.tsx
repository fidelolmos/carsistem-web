"use client";

import { useState, FormEvent, useEffect } from "react";
import { X, User, Car, Settings } from "lucide-react";
import type { VehicleCreateRequest, Vehicle } from "@/src/lib/types/vehicle";
import type { Client } from "@/src/lib/types/client";
import type { Branch } from "@/src/lib/types/branch";

type VehicleFormModalProps = {
  isOpen: boolean;
  vehicle?: Vehicle | null;
  clients: Client[];
  branches?: Branch[];
  onClose: () => void;
  onSubmit: (data: VehicleCreateRequest) => Promise<void>;
  loading?: boolean;
};

// Tipo para campos de metadata
type MetadataFields = {
  version?: string;
  color?: string;
  transmision?: string;
  flota?: string; // El flota que va a metadata (no el booleano)
  estadoDelVehiculo?: string;
  sucursalPreferida?: string;
};

export default function VehicleFormModal({
  isOpen,
  vehicle,
  clients,
  branches = [],
  onClose,
  onSubmit,
  loading = false,
}: VehicleFormModalProps) {
  // Estados para campos de metadata
  const [metadataFields, setMetadataFields] = useState<MetadataFields>({
    version: "",
    color: "",
    transmision: "",
    flota: "",
    estadoDelVehiculo: "Activo",
    sucursalPreferida: "",
  });

  const [formData, setFormData] = useState<VehicleCreateRequest>({
    client_id: "",
    economico: "",
    license: "",
    vin: "",
    model: "",
    brand: "",
    year: new Date().getFullYear(),
    tipo: "",
    fuelType: "gasolina",
    odometer: 0,
    fleet: false, // Este es el booleano
    projectId: "",
    advisor: "",
    metadata: "{}",
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof VehicleCreateRequest, string>>
  >({});

  // Cargar datos cuando se abre el modal para editar
  useEffect(() => {
    if (!isOpen) return;

    if (vehicle) {
      // Modo edición: cargar datos del vehículo
      setFormData({
        client_id: vehicle.client_id || "",
        economico: vehicle.economico || "",
        license: vehicle.license || "",
        vin: vehicle.vin || "",
        model: vehicle.model || "",
        brand: vehicle.brand || "",
        year: vehicle.year || new Date().getFullYear(),
        tipo: vehicle.tipo || "",
        fuelType: vehicle.fuelType || "gasolina",
        odometer: vehicle.odometer || 0,
        fleet: vehicle.fleet || false,
        projectId: vehicle.projectId || "",
        advisor: vehicle.advisor || "",
        metadata: vehicle.metadata || "{}",
      });

      // Parsear metadata
      try {
        const metadata = vehicle.metadata ? JSON.parse(vehicle.metadata) : {};
        setMetadataFields({
          version: metadata.version || "",
          color: metadata.color || "",
          transmision: metadata.transmision || "",
          flota: metadata.flota || "",
          estadoDelVehiculo: metadata.estadoDelVehiculo || "Activo",
          sucursalPreferida: metadata.sucursalPreferida || "",
        });
      } catch {
        setMetadataFields({
          version: "",
          color: "",
          transmision: "",
          flota: "",
          estadoDelVehiculo: "Activo",
          sucursalPreferida: "",
        });
      }
    } else {
      // Modo creación: resetear formulario
      setFormData({
        client_id: "",
        economico: "",
        license: "",
        vin: "",
        model: "",
        brand: "",
        year: new Date().getFullYear(),
        tipo: "",
        fuelType: "gasolina",
        odometer: 0,
        fleet: false,
        projectId: "",
        advisor: "",
        metadata: "{}",
      });
      setMetadataFields({
        version: "",
        color: "",
        transmision: "",
        flota: "",
        estadoDelVehiculo: "Activo",
        sucursalPreferida: "",
      });
    }
    setErrors({});
  }, [isOpen, vehicle?._id]);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
          ? value === ""
            ? 0
            : Number(value)
          : value,
    }));

    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name as keyof VehicleCreateRequest]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleMetadataChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setMetadataFields((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof VehicleCreateRequest, string>> = {};

    if (!formData.client_id.trim()) {
      newErrors.client_id = "El cliente es requerido";
    }

    // El campo económico no está en el formulario visual, pero se mantiene en el estado
    // Si es requerido por el backend, se puede agregar de vuelta al formulario

    if (!formData.license.trim()) {
      newErrors.license = "Las placas son requeridas";
    }

    if (!formData.vin.trim()) {
      newErrors.vin = "El VIN es requerido";
    }

    if (!formData.model.trim()) {
      newErrors.model = "El modelo es requerido";
    }

    if (!formData.brand.trim()) {
      newErrors.brand = "La marca es requerida";
    }

    if (
      !formData.year ||
      formData.year < 1900 ||
      formData.year > new Date().getFullYear() + 1
    ) {
      newErrors.year = "El año debe ser válido";
    }

    if (!formData.tipo.trim()) {
      newErrors.tipo = "El tipo de vehículo es requerido";
    }

    if (!formData.fuelType.trim()) {
      newErrors.fuelType = "El tipo de combustible es requerido";
    }

    if (formData.odometer < 0) {
      newErrors.odometer = "El odómetro no puede ser negativo";
    }

    // Validar transmisión si es requerida
    if (!metadataFields.transmision?.trim()) {
      // No agregamos error aquí porque no está en el tipo VehicleCreateRequest
      // pero podemos mostrar un mensaje de consola o agregar validación visual
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
      // Construir metadata solo con campos que tienen valor
      const metadataObj: MetadataFields = {};
      if (metadataFields.version?.trim()) {
        metadataObj.version = metadataFields.version.trim();
      }
      if (metadataFields.color?.trim()) {
        metadataObj.color = metadataFields.color.trim();
      }
      if (metadataFields.transmision?.trim()) {
        metadataObj.transmision = metadataFields.transmision.trim();
      }
      if (metadataFields.flota?.trim()) {
        metadataObj.flota = metadataFields.flota.trim();
      }
      if (metadataFields.estadoDelVehiculo?.trim()) {
        metadataObj.estadoDelVehiculo = metadataFields.estadoDelVehiculo.trim();
      }
      if (metadataFields.sucursalPreferida?.trim()) {
        metadataObj.sucursalPreferida = metadataFields.sucursalPreferida.trim();
      }

      const submitData: VehicleCreateRequest = {
        client_id: formData.client_id.trim(),
        economico: formData.economico.trim() || "", // Si no está en el formulario, enviar vacío
        license: formData.license.trim().toUpperCase(),
        vin: formData.vin.trim().toUpperCase(),
        model: formData.model.trim(),
        brand: formData.brand.trim(),
        year: formData.year,
        tipo: formData.tipo.trim(),
        fuelType: formData.fuelType.trim(),
        odometer: formData.odometer,
        fleet: formData.fleet,
        metadata: JSON.stringify(metadataObj),
      };

      console.log(
        "Datos del formulario antes de enviar:",
        JSON.stringify(submitData, null, 2)
      );

      // Solo incluir campos opcionales si tienen valor
      if (formData.projectId && formData.projectId.trim()) {
        submitData.projectId = formData.projectId.trim();
      }

      if (formData.advisor && formData.advisor.trim()) {
        submitData.advisor = formData.advisor.trim();
      }

      await onSubmit(submitData);
      setErrors({});
    } catch (error) {
      console.error("Error en handleSubmit del modal:", error);
      // El error se maneja en el componente padre
      if (error && typeof error === "object" && "details" in error) {
        const details = (error as { details?: unknown }).details;
        if (details && typeof details === "object") {
          const detailsObj = details as { [key: string]: unknown };
          const fieldErrors: Partial<
            Record<keyof VehicleCreateRequest, string>
          > = {};
          Object.keys(detailsObj).forEach((key) => {
            if (key in formData) {
              const errorValue = detailsObj[key];
              if (typeof errorValue === "string") {
                fieldErrors[key as keyof VehicleCreateRequest] = errorValue;
              } else if (Array.isArray(errorValue) && errorValue.length > 0) {
                fieldErrors[key as keyof VehicleCreateRequest] = String(
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
        client_id: "",
        economico: "",
        license: "",
        vin: "",
        model: "",
        brand: "",
        year: new Date().getFullYear(),
        tipo: "",
        fuelType: "gasolina",
        odometer: 0,
        fleet: false,
        projectId: "",
        advisor: "",
        metadata: "{}",
      });
      setMetadataFields({
        version: "",
        color: "",
        transmision: "",
        flota: "",
        estadoDelVehiculo: "Activo",
        sucursalPreferida: "",
      });
      setErrors({});
      onClose();
    }
  };

  const isEditing = !!vehicle;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {isEditing ? "Editar Vehículo" : "Alta de Vehículo"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
              Registra un nuevo vehículo y asócialo con un cliente y flota
              opcional
            </p>
          </div>
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
          {/* Selección de Cliente */}
          <div className="space-y-4 bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-gray-600 dark:text-zinc-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Selección de Cliente
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                  Cliente <span className="text-red-500">*</span>
                </label>
                <select
                  name="client_id"
                  value={formData.client_id}
                  onChange={handleChange}
                  className={`w-full rounded-xl bg-white dark:bg-zinc-800 border px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 transition-colors ${
                    errors.client_id
                      ? "border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/30"
                      : "border-gray-200 dark:border-zinc-700 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                  }`}
                  disabled={loading}
                >
                  <option value="">Selecciona un cliente</option>
                  {clients.map((client) => (
                    <option
                      key={client.id || client._id}
                      value={client.id || client._id}
                    >
                      {client.name}
                    </option>
                  ))}
                </select>
                {errors.client_id && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.client_id}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Identificación del Vehículo */}
          <div className="space-y-4 bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <Car className="w-5 h-5 text-gray-600 dark:text-zinc-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Identificación del Vehículo
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* VIN */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                  VIN (Número de Serie) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="vin"
                  value={formData.vin}
                  onChange={handleChange}
                  placeholder="1HGBH41JXMN109186"
                  className={`w-full rounded-xl bg-white dark:bg-zinc-800 border px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-400 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 transition-colors ${
                    errors.vin
                      ? "border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/30"
                      : "border-gray-200 dark:border-zinc-700 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                  }`}
                  disabled={loading}
                />
                {errors.vin && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.vin}
                  </p>
                )}
              </div>

              {/* Placas */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                  Placas <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="license"
                  value={formData.license}
                  onChange={handleChange}
                  placeholder="ABC-123-D"
                  className={`w-full rounded-xl bg-white dark:bg-zinc-800 border px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-400 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 transition-colors ${
                    errors.license
                      ? "border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/30"
                      : "border-gray-200 dark:border-zinc-700 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                  }`}
                  disabled={loading}
                />
                {errors.license && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.license}
                  </p>
                )}
              </div>

              {/* Marca */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                  Marca <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  placeholder="Toyota"
                  className={`w-full rounded-xl bg-white dark:bg-zinc-800 border px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-400 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 transition-colors ${
                    errors.brand
                      ? "border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/30"
                      : "border-gray-200 dark:border-zinc-700 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                  }`}
                  disabled={loading}
                />
                {errors.brand && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.brand}
                  </p>
                )}
              </div>

              {/* Modelo */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                  Modelo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  placeholder="Camry"
                  className={`w-full rounded-xl bg-white dark:bg-zinc-800 border px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-400 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 transition-colors ${
                    errors.model
                      ? "border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/30"
                      : "border-gray-200 dark:border-zinc-700 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                  }`}
                  disabled={loading}
                />
                {errors.model && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.model}
                  </p>
                )}
              </div>

              {/* Año */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                  Año <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  placeholder="2024"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  className={`w-full rounded-xl bg-white dark:bg-zinc-800 border px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-400 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 transition-colors ${
                    errors.year
                      ? "border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/30"
                      : "border-gray-200 dark:border-zinc-700 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                  }`}
                  disabled={loading}
                />
                {errors.year && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.year}
                  </p>
                )}
              </div>

              {/* Versión */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                  Versión
                </label>
                <input
                  type="text"
                  name="version"
                  value={metadataFields.version}
                  onChange={handleMetadataChange}
                  placeholder="XLE Premium"
                  className="w-full rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-400 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-colors"
                  disabled={loading}
                />
              </div>

              {/* Color */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                  Color
                </label>
                <input
                  type="text"
                  name="color"
                  value={metadataFields.color}
                  onChange={handleMetadataChange}
                  placeholder="Negro"
                  className="w-full rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-400 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-colors"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Información Técnica */}
          <div className="space-y-4 bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-600 dark:text-zinc-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Información Técnica
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tipo de Vehículo */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                  Tipo de Vehículo <span className="text-red-500">*</span>
                </label>
                <select
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleChange}
                  className={`w-full rounded-xl bg-white dark:bg-zinc-800 border px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 transition-colors ${
                    errors.tipo
                      ? "border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/30"
                      : "border-gray-200 dark:border-zinc-700 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                  }`}
                  disabled={loading}
                >
                  <option value="">Selecciona un tipo</option>
                  <option value="automovil">Automóvil</option>
                  <option value="camioneta">Camioneta</option>
                  <option value="van">Van</option>
                  <option value="motocicleta">Motocicleta</option>
                  <option value="SUV">SUV</option>
                  <option value="pickup">Pickup</option>
                </select>
                {errors.tipo && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.tipo}
                  </p>
                )}
              </div>

              {/* Tipo de Combustible */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                  Tipo de Combustible <span className="text-red-500">*</span>
                </label>
                <select
                  name="fuelType"
                  value={formData.fuelType}
                  onChange={handleChange}
                  className={`w-full rounded-xl bg-white dark:bg-zinc-800 border px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 transition-colors ${
                    errors.fuelType
                      ? "border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/30"
                      : "border-gray-200 dark:border-zinc-700 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                  }`}
                  disabled={loading}
                >
                  <option value="">Selecciona un tipo</option>
                  <option value="gasolina">Gasolina</option>
                  <option value="diesel">Diesel</option>
                  <option value="electrico">Eléctrico</option>
                  <option value="hibrido">Híbrido</option>
                  <option value="gas">Gas</option>
                </select>
                {errors.fuelType && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.fuelType}
                  </p>
                )}
              </div>

              {/* Transmisión */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                  Transmisión
                </label>
                <select
                  name="transmision"
                  value={metadataFields.transmision}
                  onChange={handleMetadataChange}
                  className="w-full rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-colors"
                  disabled={loading}
                >
                  <option value="">Selecciona una opción</option>
                  <option value="Manual">Manual</option>
                  <option value="Automática">Automática</option>
                  <option value="CVT">CVT</option>
                  <option value="DCT">DCT (Doble Embrague)</option>
                </select>
              </div>

              {/* Kilometraje Actual */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                  Kilometraje Actual <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="odometer"
                    value={formData.odometer}
                    onChange={handleChange}
                    placeholder="50000"
                    min="0"
                    className={`w-full rounded-xl bg-white dark:bg-zinc-800 border px-4 py-3 pl-10 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-400 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 transition-colors ${
                      errors.odometer
                        ? "border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/30"
                        : "border-gray-200 dark:border-zinc-700 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                    }`}
                    disabled={loading}
                  />
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                {errors.odometer && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.odometer}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Información Operacional */}
          <div className="space-y-4 bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Información Operacional
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Flota (Opcional) - El que va a metadata */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                  Flota (Opcional)
                </label>
                <select
                  name="flota"
                  value={metadataFields.flota}
                  onChange={handleMetadataChange}
                  className="w-full rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-colors"
                  disabled={loading}
                >
                  <option value="">Sin flota asignada</option>
                  <option value="Sin flota">Sin flota</option>
                  <option value="Flota Ejecutiva">Flota Ejecutiva</option>
                  <option value="Flota de Reparto">Flota de Reparto</option>
                  <option value="Flota de Ventas">Flota de Ventas</option>
                </select>
              </div>

              {/* Sucursal Preferida */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                  Sucursal Preferida
                </label>
                <select
                  name="sucursalPreferida"
                  value={metadataFields.sucursalPreferida}
                  onChange={handleMetadataChange}
                  className="w-full rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-colors"
                  disabled={loading}
                >
                  <option value="">Selecciona una sucursal</option>
                  {branches.map((branch) => {
                    const branchId = branch.id || branch.code;
                    return (
                      <option key={branchId} value={branchId}>
                        {branch.name}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Estado del Vehículo */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                  Estado del Vehículo
                </label>
                <select
                  name="estadoDelVehiculo"
                  value={metadataFields.estadoDelVehiculo}
                  onChange={handleMetadataChange}
                  className="w-full rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-colors"
                  disabled={loading}
                >
                  <option value="Activo">Activo</option>
                  <option value="En Servicio">En Servicio</option>
                  <option value="Dado de Baja">Dado de Baja</option>
                </select>
              </div>
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
                "Crear Vehículo"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
