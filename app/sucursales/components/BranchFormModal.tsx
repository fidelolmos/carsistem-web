"use client";

import { useState, FormEvent, useEffect } from "react";
import { X, Upload } from "lucide-react";
import Image from "next/image";
import type { BranchCreateRequest, Branch } from "@/src/lib/types/branch";

type BranchFormModalProps = {
  isOpen: boolean;
  branch?: Branch | null;
  onClose: () => void;
  onSubmit: (data: BranchCreateRequest) => Promise<void>;
  loading?: boolean;
};

type MetadataFields = {
  manager?: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  hours?: string;
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  color?: string; // Mantener compatibilidad con el campo color anterior
};

export default function BranchFormModal({
  isOpen,
  branch,
  onClose,
  onSubmit,
  loading = false,
}: BranchFormModalProps) {
  const [formData, setFormData] = useState<
    BranchCreateRequest & MetadataFields
  >({
    code: "",
    name: "",
    address: "",
    phone: "",
    email: "",
    metadata: "{}",
    manager: "",
    street: "",
    city: "",
    state: "",
    postalCode: "",
    hours: "",
    logo: "",
    primaryColor: "#2563eb",
    secondaryColor: "#3b82f6",
    color: "#2563eb", // Mantener para compatibilidad
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof BranchCreateRequest, string>>
  >({});

  // Cargar datos cuando se abre el modal para editar
  useEffect(() => {
    if (!isOpen) return;

    if (branch) {
      // Modo edición: cargar datos del branch
      let metadataObj: MetadataFields = {};

      try {
        metadataObj = branch.metadata ? JSON.parse(branch.metadata) : {};
      } catch {
        // Si metadata no es un JSON válido, usar valores por defecto
        metadataObj = {};
      }

      // Construir dirección completa desde metadata o usar address
      const street = metadataObj.street || "";
      const city = metadataObj.city || "";
      const state = metadataObj.state || "";
      const postalCode = metadataObj.postalCode || "";

      // Si no hay campos desglosados pero hay address, usar address original
      const address = branch.address || "";

      setFormData({
        code: branch.code || "",
        name: branch.name || "",
        address: address,
        phone: branch.phone || "",
        email: branch.email || "",
        metadata: branch.metadata || "{}",
        manager: metadataObj.manager || "",
        street: street,
        city: city,
        state: state,
        postalCode: postalCode,
        hours: metadataObj.hours || "",
        logo: metadataObj.logo || "",
        primaryColor:
          metadataObj.primaryColor || metadataObj.color || "#2563eb",
        secondaryColor: metadataObj.secondaryColor || "#3b82f6",
        color: metadataObj.primaryColor || metadataObj.color || "#2563eb", // Compatibilidad
      });
    } else {
      // Modo creación: resetear formulario
      setFormData({
        code: "",
        name: "",
        address: "",
        phone: "",
        email: "",
        metadata: "{}",
        manager: "",
        street: "",
        city: "",
        state: "",
        postalCode: "",
        hours: "",
        logo: "",
        primaryColor: "#2563eb",
        secondaryColor: "#3b82f6",
        color: "#2563eb",
      });
    }
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, branch?.id]); // Solo dependemos del ID para evitar re-renders innecesarios

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name as keyof BranchCreateRequest]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleColorChange = (
    color: string,
    type: "primary" | "secondary" = "primary"
  ) => {
    if (type === "primary") {
      setFormData((prev) => ({ ...prev, primaryColor: color, color })); // Mantener compatibilidad
    } else {
      setFormData((prev) => ({ ...prev, secondaryColor: color }));
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Por ahora, solo guardamos la URL si es una URL, o el nombre del archivo
      // En producción, deberías subir el archivo a un servicio de almacenamiento
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof BranchCreateRequest, string>> = {};

    if (!formData.code.trim()) {
      newErrors.code = "El código es requerido";
    }

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es requerido";
    }

    // Validar dirección: debe tener address o al menos street
    const hasAddress = formData.address.trim().length > 0;
    const hasStreet =
      formData.street?.trim() && formData.street.trim().length > 0;

    if (!hasAddress && !hasStreet) {
      newErrors.address = "La dirección es requerida";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "El teléfono es requerido";
    }

    if (!formData.email.trim()) {
      newErrors.email = "El email es requerido";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = "Por favor, ingresa un correo electrónico válido";
      }
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
      // Construir dirección completa desde campos desglosados o usar address
      let fullAddress = "";

      // Si hay campos desglosados, construir la dirección desde ellos
      const hasStreet =
        formData.street?.trim() && formData.street.trim().length > 0;
      if (hasStreet || formData.city || formData.state || formData.postalCode) {
        const addressParts = [
          formData.street?.trim(),
          formData.city?.trim(),
          formData.state?.trim(),
          formData.postalCode?.trim(),
        ].filter(Boolean);
        if (addressParts.length > 0) {
          fullAddress = addressParts.join(", ");
        }
      }

      // Si no se construyó desde campos desglosados, usar el campo address
      if (!fullAddress) {
        fullAddress = formData.address.trim();
      }

      // Construir metadata con todos los campos adicionales
      let metadataObj: MetadataFields = {};
      try {
        metadataObj = formData.metadata.trim()
          ? JSON.parse(formData.metadata)
          : {};
      } catch {
        metadataObj = {};
      }

      // Actualizar metadata con todos los campos adicionales
      metadataObj = {
        ...metadataObj,
        manager: formData.manager?.trim() || undefined,
        street: formData.street?.trim() || undefined,
        city: formData.city?.trim() || undefined,
        state: formData.state?.trim() || undefined,
        postalCode: formData.postalCode?.trim() || undefined,
        hours: formData.hours?.trim() || undefined,
        logo: formData.logo?.trim() || undefined,
        primaryColor: formData.primaryColor || "#2563eb",
        secondaryColor: formData.secondaryColor || "#3b82f6",
        color: formData.primaryColor || formData.color || "#2563eb", // Mantener compatibilidad
      };

      // Limpiar campos undefined del metadata
      Object.keys(metadataObj).forEach((key) => {
        if (metadataObj[key as keyof MetadataFields] === undefined) {
          delete metadataObj[key as keyof MetadataFields];
        }
      });

      const submitData = {
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        address: fullAddress,
        phone: formData.phone.trim(),
        email: formData.email.trim().toLowerCase(),
        metadata: JSON.stringify(metadataObj),
      };

      console.log("Enviando datos al onSubmit:", submitData);

      await onSubmit(submitData);

      // El reseteo se hará cuando se cierre el modal
      setErrors({});
    } catch (error) {
      // El error se maneja en el componente padre
      console.error("Error en handleSubmit del modal:", error);
      // No re-lanzar el error, ya que el padre lo maneja
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        code: "",
        name: "",
        address: "",
        phone: "",
        email: "",
        metadata: "{}",
        manager: "",
        street: "",
        city: "",
        state: "",
        postalCode: "",
        hours: "",
        logo: "",
        primaryColor: "#2563eb",
        secondaryColor: "#3b82f6",
        color: "#2563eb",
      });
      setErrors({});
      onClose();
    }
  };

  const isEditing = !!branch;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-6 py-4 flex flex-col gap-1 z-10">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {isEditing ? "Editar Sucursal" : "Crear Sucursal"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            {isEditing
              ? "Configura los detalles de la sucursal"
              : "Completa los datos de la nueva sucursal"}
          </p>
          <button
            onClick={handleClose}
            disabled={loading}
            className="absolute top-4 right-6 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Logo de la Sucursal */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
              Logo de la Sucursal
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-xl p-8 text-center">
              {formData.logo ? (
                <div className="space-y-4">
                  <div className="relative max-h-32 mx-auto rounded-lg overflow-hidden">
                    <Image
                      src={formData.logo}
                      alt="Logo de la sucursal"
                      width={128}
                      height={128}
                      className="object-contain max-h-32 mx-auto rounded-lg"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, logo: "" }))
                    }
                    className="text-sm text-red-600 dark:text-red-400 hover:underline"
                    disabled={loading}
                  >
                    Eliminar logo
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-500 dark:text-zinc-400">Sin logo</p>
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors disabled:opacity-50">
                    <Upload size={16} />
                    Subir Imagen
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                      disabled={loading}
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Código */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                Código de la Sucursal
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="MAIN"
                className={`w-full rounded-xl bg-gray-100 dark:bg-zinc-800 border px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-400 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 transition-colors ${
                  errors.code
                    ? "border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/30"
                    : "border-gray-100 dark:border-zinc-700 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                }`}
                disabled={loading}
              />
              {errors.code && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errors.code}
                </p>
              )}
            </div>

            {/* Nombre */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                Nombre de la Sucursal
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Sucursal Principal"
                className={`w-full rounded-xl bg-gray-100 dark:bg-zinc-800 border px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-400 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 transition-colors ${
                  errors.name
                    ? "border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/30"
                    : "border-gray-100 dark:border-zinc-700 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                }`}
                disabled={loading}
              />
              {errors.name && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errors.name}
                </p>
              )}
            </div>

            {/* Gerente */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                Gerente
              </label>
              <input
                type="text"
                name="manager"
                value={formData.manager || ""}
                onChange={handleChange}
                placeholder="Carlos Mendoza"
                className="w-full rounded-xl bg-gray-100 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-400 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-colors"
                disabled={loading}
              />
            </div>
          </div>

          {/* Dirección desglosada */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
              Dirección
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <input
                  type="text"
                  name="street"
                  value={formData.street || ""}
                  onChange={handleChange}
                  placeholder="Av. Reforma 123, Col. Centro"
                  className="w-full rounded-xl bg-gray-100 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-400 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-colors"
                  disabled={loading}
                />
              </div>
              <div>
                <input
                  type="text"
                  name="city"
                  value={formData.city || ""}
                  onChange={handleChange}
                  placeholder="Ciudad de México"
                  className="w-full rounded-xl bg-gray-100 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-400 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-colors"
                  disabled={loading}
                />
              </div>
              <div>
                <input
                  type="text"
                  name="state"
                  value={formData.state || ""}
                  onChange={handleChange}
                  placeholder="CDMX"
                  className="w-full rounded-xl bg-gray-100 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-400 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-colors"
                  disabled={loading}
                />
              </div>
              <div>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode || ""}
                  onChange={handleChange}
                  placeholder="06000"
                  className="w-full rounded-xl bg-gray-100 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-400 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-colors"
                  disabled={loading}
                />
              </div>
            </div>
            {/* Campo de dirección completa como respaldo */}
            <input type="hidden" name="address" value={formData.address} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Teléfono */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                Teléfono
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="55-1234-5678"
                className={`w-full rounded-xl bg-gray-100 dark:bg-zinc-800 border px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-400 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 transition-colors ${
                  errors.phone
                    ? "border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/30"
                    : "border-gray-100 dark:border-zinc-700 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                }`}
                disabled={loading}
              />
              {errors.phone && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errors.phone}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="centro@carsistem.mx"
                className={`w-full rounded-xl bg-gray-100 dark:bg-zinc-800 border px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-400 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 transition-colors ${
                  errors.email
                    ? "border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/30"
                    : "border-gray-100 dark:border-zinc-700 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                }`}
                disabled={loading}
              />
              {errors.email && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Horario de Atención */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                Horario de Atención
              </label>
              <input
                type="text"
                name="hours"
                value={formData.hours || ""}
                onChange={handleChange}
                placeholder="Lun-Vie 8:00-18:00, Sáb 9:00-14:00"
                className="w-full rounded-xl bg-gray-100 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-400 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-colors"
                disabled={loading}
              />
            </div>
          </div>

          {/* Colores */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Color Primario */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                Color Primario
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={formData.primaryColor || "#2563eb"}
                  onChange={(e) => handleColorChange(e.target.value, "primary")}
                  className="w-20 h-12 rounded-lg border border-gray-300 dark:border-zinc-700 cursor-pointer"
                  disabled={loading}
                />
                <input
                  type="text"
                  value={formData.primaryColor || "#2563eb"}
                  onChange={(e) => handleColorChange(e.target.value, "primary")}
                  placeholder="#2563eb"
                  className="flex-1 rounded-xl bg-gray-100 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-400 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-colors"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Color Secundario */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                Color Secundario
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={formData.secondaryColor || "#3b82f6"}
                  onChange={(e) =>
                    handleColorChange(e.target.value, "secondary")
                  }
                  className="w-20 h-12 rounded-lg border border-gray-300 dark:border-zinc-700 cursor-pointer"
                  disabled={loading}
                />
                <input
                  type="text"
                  value={formData.secondaryColor || "#3b82f6"}
                  onChange={(e) =>
                    handleColorChange(e.target.value, "secondary")
                  }
                  placeholder="#3b82f6"
                  className="flex-1 rounded-xl bg-gray-100 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-400 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-colors"
                  disabled={loading}
                />
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-zinc-400">
            Elige colores para identificar visualmente esta sucursal
          </p>

          {/* Metadata (oculto por defecto, pero presente en el form) */}
          <input type="hidden" name="metadata" value={formData.metadata} />

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
                "Crear Sucursal"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
