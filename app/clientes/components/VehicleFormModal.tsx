"use client";

import { useState, FormEvent, useEffect } from "react";
import { X } from "lucide-react";
import type { VehicleCreateRequest, Vehicle } from "@/src/lib/types/vehicle";
import type { Client } from "@/src/lib/types/client";

type VehicleFormModalProps = {
  isOpen: boolean;
  vehicle?: Vehicle | null;
  clients: Client[];
  onClose: () => void;
  onSubmit: (data: VehicleCreateRequest) => Promise<void>;
  loading?: boolean;
};

export default function VehicleFormModal({
  isOpen,
  vehicle,
  clients,
  onClose,
  onSubmit,
  loading = false,
}: VehicleFormModalProps) {
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
    fleet: false,
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

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof VehicleCreateRequest, string>> = {};

    if (!formData.client_id.trim()) {
      newErrors.client_id = "El cliente es requerido";
    }

    if (!formData.economico.trim()) {
      newErrors.economico = "El económico es requerido";
    }

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      const submitData: VehicleCreateRequest = {
        client_id: formData.client_id.trim(),
        economico: formData.economico.trim(),
        license: formData.license.trim().toUpperCase(),
        vin: formData.vin.trim().toUpperCase(),
        model: formData.model.trim(),
        brand: formData.brand.trim(),
        year: formData.year,
        tipo: formData.tipo.trim(),
        fuelType: formData.fuelType.trim(),
        odometer: formData.odometer,
        fleet: formData.fleet,
        metadata: formData.metadata || "{}",
      };

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
      setErrors({});
      onClose();
    }
  };

  const isEditing = !!vehicle;

  // Obtener el nombre del cliente seleccionado
  const selectedClient = clients.find(
    (c) => (c.id || c._id) === formData.client_id
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {isEditing ? "Editar Vehículo" : "Alta de Vehículo"}
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
          {/* Información del Vehículo */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Información del Vehículo
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cliente */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                  Cliente <span className="text-red-500">*</span>
                </label>
                <select
                  name="client_id"
                  value={formData.client_id}
                  onChange={handleChange}
                  className={`w-full rounded-xl bg-gray-100 dark:bg-zinc-800 border px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 transition-colors ${
                    errors.client_id
                      ? "border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/30"
                      : "border-gray-100 dark:border-zinc-700 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                  }`}
                  disabled={loading}
                >
                  <option value="">Seleccione un cliente</option>
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

              {/* Económico */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                  Económico <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="economico"
                  value={formData.economico}
                  onChange={handleChange}
                  placeholder="ECO-001"
                  className={`w-full rounded-xl bg-gray-100 dark:bg-zinc-800 border px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-400 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 transition-colors ${
                    errors.economico
                      ? "border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/30"
                      : "border-gray-100 dark:border-zinc-700 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                  }`}
                  disabled={loading}
                />
                {errors.economico && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.economico}
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
                  placeholder="ABC-1234"
                  className={`w-full rounded-xl bg-gray-100 dark:bg-zinc-800 border px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-400 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 transition-colors ${
                    errors.license
                      ? "border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/30"
                      : "border-gray-100 dark:border-zinc-700 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                  }`}
                  disabled={loading}
                />
                {errors.license && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.license}
                  </p>
                )}
              </div>

              {/* VIN */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                  VIN <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="vin"
                  value={formData.vin}
                  onChange={handleChange}
                  placeholder="1HGCM82633A004352"
                  className={`w-full rounded-xl bg-gray-100 dark:bg-zinc-800 border px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-400 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 transition-colors ${
                    errors.vin
                      ? "border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/30"
                      : "border-gray-100 dark:border-zinc-700 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                  }`}
                  disabled={loading}
                />
                {errors.vin && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.vin}
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
                  placeholder="Honda"
                  className={`w-full rounded-xl bg-gray-100 dark:bg-zinc-800 border px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-400 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 transition-colors ${
                    errors.brand
                      ? "border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/30"
                      : "border-gray-100 dark:border-zinc-700 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30"
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
                  placeholder="Civic"
                  className={`w-full rounded-xl bg-gray-100 dark:bg-zinc-800 border px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-400 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 transition-colors ${
                    errors.model
                      ? "border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/30"
                      : "border-gray-100 dark:border-zinc-700 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30"
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
                  placeholder="2020"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  className={`w-full rounded-xl bg-gray-100 dark:bg-zinc-800 border px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-400 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 transition-colors ${
                    errors.year
                      ? "border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/30"
                      : "border-gray-100 dark:border-zinc-700 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                  }`}
                  disabled={loading}
                />
                {errors.year && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.year}
                  </p>
                )}
              </div>

              {/* Tipo */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                  Tipo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleChange}
                  placeholder="Sedan"
                  className={`w-full rounded-xl bg-gray-100 dark:bg-zinc-800 border px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-400 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 transition-colors ${
                    errors.tipo
                      ? "border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/30"
                      : "border-gray-100 dark:border-zinc-700 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                  }`}
                  disabled={loading}
                />
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
                  className={`w-full rounded-xl bg-gray-100 dark:bg-zinc-800 border px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 transition-colors ${
                    errors.fuelType
                      ? "border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/30"
                      : "border-gray-100 dark:border-zinc-700 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                  }`}
                  disabled={loading}
                >
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

              {/* Odómetro */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                  Odómetro <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="odometer"
                  value={formData.odometer}
                  onChange={handleChange}
                  placeholder="120000"
                  min="0"
                  className={`w-full rounded-xl bg-gray-100 dark:bg-zinc-800 border px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-400 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 transition-colors ${
                    errors.odometer
                      ? "border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/30"
                      : "border-gray-100 dark:border-zinc-700 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                  }`}
                  disabled={loading}
                />
                {errors.odometer && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.odometer}
                  </p>
                )}
              </div>

              {/* Fleet */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                  Flota
                </label>
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    name="fleet"
                    checked={formData.fleet}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 rounded"
                    disabled={loading}
                  />
                  <span className="text-sm text-gray-900 dark:text-white">
                    Es parte de una flota
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Información Adicional */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Información Adicional
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Project ID */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                  ID de Proyecto
                </label>
                <input
                  type="text"
                  name="projectId"
                  value={formData.projectId}
                  onChange={handleChange}
                  placeholder="project-01"
                  className="w-full rounded-xl bg-gray-100 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-400 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-colors"
                  disabled={loading}
                />
              </div>

              {/* Advisor */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                  Asesor
                </label>
                <input
                  type="text"
                  name="advisor"
                  value={formData.advisor}
                  onChange={handleChange}
                  placeholder="asesor-id"
                  className="w-full rounded-xl bg-gray-100 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-400 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-colors"
                  disabled={loading}
                />
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
