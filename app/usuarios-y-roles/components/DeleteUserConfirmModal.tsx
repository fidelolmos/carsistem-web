"use client";

import { AlertTriangle, X } from "lucide-react";

type DeleteUserConfirmModalProps = {
  isOpen: boolean;
  userName: string;
  userUsername?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
};

export default function DeleteUserConfirmModal({
  isOpen,
  userName,
  userUsername,
  onConfirm,
  onCancel,
  isDeleting = false,
}: DeleteUserConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                ¿Eliminar usuario?
              </h3>
              <p className="text-sm text-gray-600 dark:text-zinc-400">
                Esta acción no se puede deshacer.
              </p>
            </div>
            <button
              onClick={onCancel}
              disabled={isDeleting}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors disabled:opacity-50"
              aria-label="Cerrar"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="px-6 pb-6">
          <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600 dark:text-zinc-400 mb-2">
              Estás a punto de eliminar al usuario:
            </p>
            <p className="text-base font-semibold text-gray-900 dark:text-white">
              {userName}
              {userUsername ? (
                <span className="text-gray-500 dark:text-zinc-400 font-normal">
                  {" "}
                  @{userUsername}
                </span>
              ) : null}
            </p>
          </div>

          <p className="text-sm text-gray-600 dark:text-zinc-400 mb-6">
            El usuario perderá el acceso al sistema de forma permanente. ¿Estás
            seguro de que deseas continuar?
          </p>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isDeleting}
              className="px-6 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="px-6 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isDeleting ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
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
                  Eliminando...
                </>
              ) : (
                "Eliminar Usuario"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
