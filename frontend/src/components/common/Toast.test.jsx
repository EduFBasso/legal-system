// src/components/common/Toast.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Toast from './Toast';

// Mock Modal component
vi.mock('../Modal', () => ({
  default: ({ isOpen, children, onClose }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="modal">
        {children}
      </div>
    );
  }
}));

describe('Toast', () => {
  let mockOnClose;

  beforeEach(() => {
    mockOnClose = vi.fn();
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders when isOpen is true and message is provided', () => {
      render(
        <Toast
          isOpen={true}
          message="Test message"
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Test message')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /OK/i })).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(
        <Toast
          isOpen={false}
          message="Test message"
          onClose={mockOnClose}
        />
      );

      expect(screen.queryByText('Test message')).not.toBeInTheDocument();
    });

    it('does not render when message is empty', () => {
      render(
        <Toast
          isOpen={true}
          message=""
          onClose={mockOnClose}
        />
      );

      expect(screen.queryByRole('button', { name: /OK/i })).not.toBeInTheDocument();
    });

    it('does not render when message is null', () => {
      render(
        <Toast
          isOpen={true}
          message={null}
          onClose={mockOnClose}
        />
      );

      expect(screen.queryByRole('button', { name: /OK/i })).not.toBeInTheDocument();
    });
  });

  describe('Manual Close', () => {
    it('calls onClose when OK button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <Toast
          isOpen={true}
          message="Test message"
          onClose={mockOnClose}
        />
      );

      const okButton = screen.getByRole('button', { name: /OK/i });
      await user.click(okButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Auto-close', () => {
    it('automatically closes after default time (3000ms)', async () => {
      render(
        <Toast
          isOpen={true}
          message="Test message"
          onClose={mockOnClose}
        />
      );

      expect(mockOnClose).not.toHaveBeenCalled();

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      }, { timeout: 3500 });
    });

    it('automatically closes after custom autoCloseMs', async () => {
      render(
        <Toast
          isOpen={true}
          message="Test message"
          onClose={mockOnClose}
          autoCloseMs={1000}
        />
      );

      expect(mockOnClose).not.toHaveBeenCalled();

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      }, { timeout: 1500 });
    });

    it('does not auto-close when autoCloseMs is 0', async () => {
      render(
        <Toast
          isOpen={true}
          message="Test message"
          onClose={mockOnClose}
          autoCloseMs={0}
        />
      );

      // Wait 500ms to ensure it doesn't close
      await new Promise(resolve => setTimeout(resolve, 500));

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('clears timer when component unmounts', () => {
      const { unmount } = render(
        <Toast
          isOpen={true}
          message="Test message"
          onClose={mockOnClose}
          autoCloseMs={3000}
        />
      );

      unmount();

      // If timer was not cleared, this could cause issues
      // Just verify no errors occur
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Message Types', () => {
    it('applies success type classes', () => {
      render(
        <Toast
          isOpen={true}
          message="Success message"
          type="success"
          onClose={mockOnClose}
        />
      );

      const toastCard = screen.getByText('Success message').closest('.toast-card');
      expect(toastCard).toHaveClass('toast-success');

      const button = screen.getByRole('button', { name: /OK/i });
      expect(button).toHaveClass('toast-button-success');
    });

    it('applies error type classes', () => {
      render(
        <Toast
          isOpen={true}
          message="Error message"
          type="error"
          onClose={mockOnClose}
        />
      );

      const toastCard = screen.getByText('Error message').closest('.toast-card');
      expect(toastCard).toHaveClass('toast-error');

      const button = screen.getByRole('button', { name: /OK/i });
      expect(button).toHaveClass('toast-button-error');
    });

    it('applies info type classes (default)', () => {
      render(
        <Toast
          isOpen={true}
          message="Info message"
          onClose={mockOnClose}
        />
      );

      const toastCard = screen.getByText('Info message').closest('.toast-card');
      expect(toastCard).toHaveClass('toast-info');

      const button = screen.getByRole('button', { name: /OK/i });
      expect(button).toHaveClass('toast-button-info');
    });

    it('applies warning type classes', () => {
      render(
        <Toast
          isOpen={true}
          message="Warning message"
          type="warning"
          onClose={mockOnClose}
        />
      );

      const toastCard = screen.getByText('Warning message').closest('.toast-card');
      expect(toastCard).toHaveClass('toast-warning');

      const button = screen.getByRole('button', { name: /OK/i });
      expect(button).toHaveClass('toast-button-warning');
    });
  });

  describe('Message Display', () => {
    it('displays the correct message text', () => {
      const testMessage = 'This is a test notification';

      render(
        <Toast
          isOpen={true}
          message={testMessage}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText(testMessage)).toBeInTheDocument();
    });

    it('displays long messages correctly', () => {
      const longMessage = 'This is a very long message that should still display correctly in the toast notification component without any issues';

      render(
        <Toast
          isOpen={true}
          message={longMessage}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('displays messages with special characters', () => {
      const specialMessage = 'Sucesso! Item #123 foi criado às 15:30.';

      render(
        <Toast
          isOpen={true}
          message={specialMessage}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText(specialMessage)).toBeInTheDocument();
    });
  });
});
