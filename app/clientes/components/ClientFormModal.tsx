'use client';

import { useState, FormEvent, useEffect } from 'react';
import { X } from 'lucide-react';
import type { ClientCreateRequest, Client } from '@/src/lib/types/client';

type ClientFormModalProps = {
  isOpen: boolean;
  client?: Client | null;
  onClose: () => void;
  onSubmit: (data: ClientCreateRequest) => Promise<void>;
  loading?: boolean;
};

export default function ClientFormModal({
  isOpen,
  client,
  onClose,
  onSubmit,
  loading = false,
}: ClientFormModalProps) {
  const [clientType, setClientType] = useState<'Empresa' | 'Persona Física'>('Persona Física');
  const [formData, setFormData] = useState<ClientCreateRequest>({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipcode: '',
    preferredContact: 'email',
    isActive: true,
    legalName: '',
    taxId: '',
    taxRegime: '601',
    cfdiUse: 'G03',
    billingEmail: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ClientCreateRequest, string>>>({});

  // Cargar datos cuando se abre el modal para editar
  useEffect(() => {
    if (!isOpen) return;

    if (client) {
      // Modo edición: cargar datos del cliente
      const isCompany = !!(client.legalName && client.legalName.trim() !== '');
      setClientType(isCompany ? 'Empresa' : 'Persona Física');
      
      setFormData({
        name: client.name || '',
        phone: client.phone || '',
        email: client.email || '',
        address: client.address || '',
        city: client.city || '',
        state: client.state || '',
        zipcode: client.zipcode || '',
        preferredContact: client.preferredContact || 'email',
        isActive: client.isActive !== undefined ? client.isActive : true,
        legalName: client.legalName || '',
        taxId: client.taxId || '',
        taxRegime: client.taxRegime || '601',
        cfdiUse: client.cfdiUse || 'G03',
        billingEmail: client.billingEmail || '',
      });
    } else {
      // Modo creación: resetear formulario
      setClientType('Persona Física');
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        state: '',
        zipcode: '',
        preferredContact: 'email',
        isActive: true,
        legalName: '',
        taxId: '',
        taxRegime: '601',
        cfdiUse: 'G03',
        billingEmail: '',
      });
    }
    setErrors({});
  }, [isOpen, client?._id]);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name as keyof ClientCreateRequest]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleClientTypeChange = (type: 'Empresa' | 'Persona Física') => {
    setClientType(type);
    if (type === 'Persona Física') {
      // Limpiar legalName cuando cambia a Persona Física
      setFormData((prev) => ({ ...prev, legalName: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ClientCreateRequest, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Por favor, ingresa un correo electrónico válido';
      }
    }

    if (!formData.address.trim()) {
      newErrors.address = 'La dirección es requerida';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'La ciudad es requerida';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'El estado es requerido';
    }

    if (!formData.zipcode.trim()) {
      newErrors.zipcode = 'El código postal es requerido';
    }

    if (clientType === 'Empresa' && !formData.legalName.trim()) {
      newErrors.legalName = 'La razón social es requerida para empresas';
    }

    if (!formData.taxId.trim()) {
      newErrors.taxId = 'El RFC es requerido';
    }

    if (!formData.billingEmail.trim()) {
      newErrors.billingEmail = 'El email de facturación es requerido';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.billingEmail.trim())) {
        newErrors.billingEmail = 'Por favor, ingresa un correo electrónico válido';
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
      const submitData: ClientCreateRequest = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim().toLowerCase(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        zipCode: formData.zipcode.trim(),
        preferredContact: formData.preferredContact,
        isActive: formData.isActive,
        taxId: formData.taxId.trim().toUpperCase(),
        taxRegime: formData.taxRegime,
        cfdiUse: formData.cfdiUse,
        billingEmail: formData.billingEmail.trim().toLowerCase(),
      };

      // Solo incluir legalName si es empresa y tiene valor
      if (clientType === 'Empresa' && formData.legalName.trim()) {
        submitData.legalName = formData.legalName.trim();
      }

      console.log('Datos del formulario antes de enviar:', JSON.stringify(submitData, null, 2));
      await onSubmit(submitData);
      setErrors({});
    } catch (error) {
      console.error('Error en handleSubmit del modal:', error);
      // El error se maneja en el componente padre
      // Pero podemos mostrar errores de validación específicos aquí si es necesario
      if (error && typeof error === 'object' && 'details' in error) {
        const details = (error as { details?: unknown }).details;
        if (details && typeof details === 'object') {
          const detailsObj = details as { [key: string]: unknown };
          // Si hay errores de validación por campo, mostrarlos
          const fieldErrors: Partial<Record<keyof ClientCreateRequest, string>> = {};
          Object.keys(detailsObj).forEach((key) => {
            if (key in formData) {
              const errorValue = detailsObj[key];
              if (typeof errorValue === 'string') {
                fieldErrors[key as keyof ClientCreateRequest] = errorValue;
              } else if (Array.isArray(errorValue) && errorValue.length > 0) {
                fieldErrors[key as keyof ClientCreateRequest] = String(errorValue[0]);
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
        name: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        state: '',
        zipcode: '',
        preferredContact: 'email',
        isActive: true,
        legalName: '',
        taxId: '',
        taxRegime: '601',
        cfdiUse: 'G03',
        billingEmail: '',
      });
      setClientType('Persona Física');
      setErrors({});
      onClose();
    }
  };

  const isEditing = !!client;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {isEditing ? 'Editar Cliente' : 'Alta de Cliente'}
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
          {/* Tipo de Cliente */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
              Tipo de Cliente
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="clientType"
                  value="Empresa"
                  checked={clientType === 'Empresa'}
                  onChange={() => handleClientTypeChange('Empresa')}
                  disabled={loading}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-900 dark:text-white">Empresa</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="clientType"
                  value="Persona Física"
                  checked={clientType === 'Persona Física'}
                  onChange={() => handleClientTypeChange('Persona Física')}
                  disabled={loading}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-900 dark:text-white">Persona Física</span>
              </label>
            </div>
          </div>

          {/* Información del Cliente */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Información del Cliente
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Razón Social (solo para empresas) */}
              {clientType === 'Empresa' && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                    Razón Social <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="legalName"
                    value={formData.legalName}
                    onChange={handleChange}
                    placeholder="Empresa S.A. de C.V."
                    className={`w-full rounded-xl bg-gray-100 dark:bg-zinc-800 border px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-400 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 transition-colors ${
                      errors.legalName
                        ? 'border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/30'
                        : 'border-gray-100 dark:border-zinc-700 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30'
                    }`}
                    disabled={loading}
                  />
                  {errors.legalName && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errors.legalName}</p>
                  )}
                </div>
              )}

              {/* Nombre del Contacto */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                  Nombre del Contacto <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Juan Pérez"
                  className={`w-full rounded-xl bg-gray-100 dark:bg-zinc-800 border px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-400 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 transition-colors ${
                    errors.name
                      ? 'border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/30'
                      : 'border-gray-100 dark:border-zinc-700 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30'
                  }`}
                  disabled={loading}
                />
                {errors.name && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.name}</p>
                )}
              </div>

              {/* RFC */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                  RFC <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="taxId"
                  value={formData.taxId}
                  onChange={handleChange}
                  placeholder="ABC123456XYZ"
                  className={`w-full rounded-xl bg-gray-100 dark:bg-zinc-800 border px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-400 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 transition-colors ${
                    errors.taxId
                      ? 'border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/30'
                      : 'border-gray-100 dark:border-zinc-700 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30'
                  }`}
                  disabled={loading}
                />
                {errors.taxId && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.taxId}</p>
                )}
              </div>

              {/* Estado */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                  Estado
                </label>
                <select
                  name="isActive"
                  value={formData.isActive ? 'true' : 'false'}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.value === 'true' }))}
                  className="w-full rounded-xl bg-gray-100 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-colors"
                  disabled={loading}
                >
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </select>
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
                  placeholder="contacto@empresa.com"
                  className={`w-full rounded-xl bg-gray-100 dark:bg-zinc-800 border px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-400 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 transition-colors ${
                    errors.email
                      ? 'border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/30'
                      : 'border-gray-100 dark:border-zinc-700 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30'
                  }`}
                  disabled={loading}
                />
                {errors.email && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                )}
              </div>

              {/* Teléfono */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                  Teléfono <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="5551234567"
                  className={`w-full rounded-xl bg-gray-100 dark:bg-zinc-800 border px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-400 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 transition-colors ${
                    errors.phone
                      ? 'border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/30'
                      : 'border-gray-100 dark:border-zinc-700 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30'
                  }`}
                  disabled={loading}
                />
                {errors.phone && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.phone}</p>
                )}
              </div>
            </div>
          </div>

          {/* Dirección */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Dirección
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                  Dirección <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Calle y número"
                  className={`w-full rounded-xl bg-gray-100 dark:bg-zinc-800 border px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-400 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 transition-colors ${
                    errors.address
                      ? 'border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/30'
                      : 'border-gray-100 dark:border-zinc-700 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30'
                  }`}
                  disabled={loading}
                />
                {errors.address && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.address}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                  Ciudad <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Ciudad de México"
                  className={`w-full rounded-xl bg-gray-100 dark:bg-zinc-800 border px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-400 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 transition-colors ${
                    errors.city
                      ? 'border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/30'
                      : 'border-gray-100 dark:border-zinc-700 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30'
                  }`}
                  disabled={loading}
                />
                {errors.city && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.city}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                  Estado <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="CDMX"
                  className={`w-full rounded-xl bg-gray-100 dark:bg-zinc-800 border px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-400 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 transition-colors ${
                    errors.state
                      ? 'border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/30'
                      : 'border-gray-100 dark:border-zinc-700 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30'
                  }`}
                  disabled={loading}
                />
                {errors.state && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.state}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                  Código Postal <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="zipcode"
                  value={formData.zipcode}
                  onChange={handleChange}
                  placeholder="01000"
                  className={`w-full rounded-xl bg-gray-100 dark:bg-zinc-800 border px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-400 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 transition-colors ${
                    errors.zipcode
                      ? 'border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/30'
                      : 'border-gray-100 dark:border-zinc-700 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30'
                  }`}
                  disabled={loading}
                />
                {errors.zipcode && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.zipcode}</p>
                )}
              </div>
            </div>
          </div>

          {/* Facturación */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Información de Facturación
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                  Régimen Fiscal
                </label>
                <input
                  type="text"
                  name="taxRegime"
                  value={formData.taxRegime}
                  onChange={handleChange}
                  placeholder="601"
                  className="w-full rounded-xl bg-gray-100 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-400 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-colors"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                  Uso de CFDI
                </label>
                <input
                  type="text"
                  name="cfdiUse"
                  value={formData.cfdiUse}
                  onChange={handleChange}
                  placeholder="G03"
                  className="w-full rounded-xl bg-gray-100 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-400 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-colors"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                  Email de Facturación <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="billingEmail"
                  value={formData.billingEmail}
                  onChange={handleChange}
                  placeholder="facturacion@empresa.com"
                  className={`w-full rounded-xl bg-gray-100 dark:bg-zinc-800 border px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-400 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 transition-colors ${
                    errors.billingEmail
                      ? 'border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/30'
                      : 'border-gray-100 dark:border-zinc-700 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30'
                  }`}
                  disabled={loading}
                />
                {errors.billingEmail && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.billingEmail}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                  Contacto Preferido
                </label>
                <select
                  name="preferredContact"
                  value={formData.preferredContact}
                  onChange={handleChange}
                  className="w-full rounded-xl bg-gray-100 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-colors"
                  disabled={loading}
                >
                  <option value="email">Email</option>
                  <option value="phone">Teléfono</option>
                  <option value="both">Ambos</option>
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
                  {isEditing ? 'Guardando...' : 'Creando...'}
                </>
              ) : (
                isEditing ? 'Guardar Cambios' : 'Crear Cliente'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

