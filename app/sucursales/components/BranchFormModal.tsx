'use client';

import { useState, FormEvent, useEffect } from 'react';
import { X } from 'lucide-react';
import type { BranchCreateRequest, Branch } from '@/src/lib/types/branch';

type BranchFormModalProps = {
  isOpen: boolean;
  branch?: Branch | null;
  onClose: () => void;
  onSubmit: (data: BranchCreateRequest) => Promise<void>;
  loading?: boolean;
};

export default function BranchFormModal({
  isOpen,
  branch,
  onClose,
  onSubmit,
  loading = false,
}: BranchFormModalProps) {
  const [formData, setFormData] = useState<BranchCreateRequest & { color: string }>({
    code: '',
    name: '',
    address: '',
    phone: '',
    email: '',
    metadata: '{}',
    color: '#2563eb', // Azul por defecto
  });

  const [errors, setErrors] = useState<Partial<Record<keyof BranchCreateRequest, string>>>({});

  // Cargar datos cuando se abre el modal para editar
  useEffect(() => {
    if (!isOpen) return;

    if (branch) {
      // Modo edición: cargar datos del branch
      let metadataObj = {};
      let color = '#2563eb';
      
      try {
        metadataObj = branch.metadata ? JSON.parse(branch.metadata) : {};
        color = (metadataObj as { color?: string }).color || '#2563eb';
      } catch {
        // Si metadata no es un JSON válido, usar valores por defecto
      }

      setFormData({
        code: branch.code || '',
        name: branch.name || '',
        address: branch.address || '',
        phone: branch.phone || '',
        email: branch.email || '',
        metadata: branch.metadata || '{}',
        color: color,
      });
    } else {
      // Modo creación: resetear formulario
      setFormData({
        code: '',
        name: '',
        address: '',
        phone: '',
        email: '',
        metadata: '{}',
        color: '#2563eb',
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

  const handleColorChange = (color: string) => {
    setFormData((prev) => ({ ...prev, color }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof BranchCreateRequest, string>> = {};

    if (!formData.code.trim()) {
      newErrors.code = 'El código es requerido';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'La dirección es requerida';
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    try {
      // Construir metadata con el color
      let metadataObj = {};
      try {
        metadataObj = formData.metadata.trim() ? JSON.parse(formData.metadata) : {};
      } catch {
        metadataObj = {};
      }
      metadataObj = { ...metadataObj, color: formData.color };

      const submitData = {
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        address: formData.address.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim().toLowerCase(),
        metadata: JSON.stringify(metadataObj),
      };

      console.log('Enviando datos al onSubmit:', submitData);
      
      await onSubmit(submitData);
      
      // El reseteo se hará cuando se cierre el modal
      setErrors({});
    } catch (error) {
      // El error se maneja en el componente padre
      console.error('Error en handleSubmit del modal:', error);
      // No re-lanzar el error, ya que el padre lo maneja
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        code: '',
        name: '',
        address: '',
        phone: '',
        email: '',
        metadata: '{}',
        color: '#2563eb',
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
        <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {isEditing ? 'Editar Sucursal' : 'Crear Sucursal'}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
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
                    ? 'border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/30'
                    : 'border-gray-100 dark:border-zinc-700 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30'
                }`}
                disabled={loading}
              />
              {errors.code && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.code}</p>
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
                    ? 'border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/30'
                    : 'border-gray-100 dark:border-zinc-700 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30'
                }`}
                disabled={loading}
              />
              {errors.name && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.name}</p>
              )}
            </div>
          </div>

          {/* Dirección */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
              Dirección
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
                placeholder="sucursal@correo.com"
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
          </div>

          {/* Color */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
              Color de la Sucursal
            </label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-20 h-12 rounded-lg border border-gray-300 dark:border-zinc-700 cursor-pointer"
                disabled={loading}
              />
              <input
                type="text"
                value={formData.color}
                onChange={(e) => handleColorChange(e.target.value)}
                placeholder="#2563eb"
                className={`flex-1 rounded-xl bg-gray-100 dark:bg-zinc-800 border px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-400 outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-4 transition-colors border-gray-100 dark:border-zinc-700 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30`}
                disabled={loading}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-zinc-400">
              Elige un color para identificar visualmente esta sucursal
            </p>
          </div>

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
                  {isEditing ? 'Guardando...' : 'Creando...'}
                </>
              ) : (
                isEditing ? 'Guardar Cambios' : 'Crear Sucursal'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

