import React from 'react';

interface ModalFooterProps {
  isLoading: boolean;
  doneProcessing: boolean;
  isInstall: boolean;
  disabled: boolean;
  onSave: () => void;
  onClose: () => void;
}

/**
 * Reusable component for modal footer with action buttons
 */
const ModalFooter: React.FC<ModalFooterProps> = ({
  isLoading,
  doneProcessing,
  isInstall,
  disabled,
  onSave,
  onClose
}) => {
  return (
    <div className="modal-footer">
      {doneProcessing ? (
        <button className="cancel-button" onClick={onClose} disabled={isLoading}>
          Close
        </button>
      ) : (
        <>
          {!isLoading && (
            <button className="cancel-button" onClick={onClose} disabled={isLoading}>
              Cancel
            </button>
          )}
          <button className="save-button" onClick={onSave} disabled={disabled}>
            {isLoading ? (
              <>
                <span className="spinner"></span>
                {isInstall ? 'Installing...' : 'Saving...'}
              </>
            ) : (
              isInstall ? 'Install' : 'Save'
            )}
          </button>
        </>
      )}
    </div>
  );
};

// Use React.memo to prevent unnecessary re-renders
export default React.memo(ModalFooter);
