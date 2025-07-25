/* eslint-disable no-console */
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { addError } from '../store/slices/errorSlice';
import { ErrorHandler, ApplicationError } from '../utils/errorHandler';

/**
 * Custom hook for handling errors in components
 */
export const useErrorHandler = () => {
  const dispatch = useDispatch();

  /**
   * Handle and display an error
   */
  const handleError = useCallback((error: Error | ApplicationError) => {
    // Log the error
    ErrorHandler.logError(error);
    
    // Convert to ApplicationError if needed
    const appError = error instanceof ApplicationError 
      ? error 
      : ErrorHandler.parseApiError(error);
    
    // Dispatch to Redux store for display
    dispatch(addError(appError.toJSON()));
  }, [dispatch]);

  /**
   * Wrap an async function with error handling
   */
  const handleAsync = useCallback(<T extends (..._args: any[]) => Promise<any>>(
    asyncFn: T
  ): T => {
    return (async (...args: Parameters<T>) => {
      try {
        return await asyncFn(...args);
      } catch (error) {
        handleError(error as Error);
        throw error; // Re-throw to allow component-specific handling
      }
    }) as T;
  }, [handleError]);

  /**
   * Execute an async operation with loading state and error handling
   */
  const executeAsync = useCallback(async <T,>(
    operation: () => Promise<T>,
    options?: {
      onSuccess?: (_result: T) => void;
      onError?: (_error: Error) => void;
      showSuccessMessage?: string;
      retries?: number;
    }
  ): Promise<T | undefined> => {
    try {
      const result = options?.retries 
        ? await ErrorHandler.withRetry(operation, options.retries)
        : await operation();
      
      if (options?.onSuccess) {
        options.onSuccess(result);
      }
      
      if (options?.showSuccessMessage) {
        // TODO: Add success notification
        console.log(options.showSuccessMessage);
      }
      
      return result;
    } catch (error) {
      const err = error as Error;
      handleError(err);
      
      if (options?.onError) {
        options.onError(err);
      }
      
      return undefined;
    }
  }, [handleError]);

  return {
    handleError,
    handleAsync,
    executeAsync
  };
};

/**
 * Example usage:
 * 
 * const MyComponent = () => {
 *   const { handleError, handleAsync, executeAsync } = useErrorHandler();
 *   
 *   // Method 1: Wrap async functions
 *   const handleUpload = handleAsync(async (file: File) => {
 *     const result = await uploadService.uploadDocument({ file, ... });
 *     // Do something with result
 *   });
 *   
 *   // Method 2: Execute with options
 *   const handleDelete = async (id: string) => {
 *     await executeAsync(
 *       () => documentService.deleteDocument(id),
 *       {
 *         onSuccess: () => console.log('Deleted successfully'),
 *         showSuccessMessage: 'Document deleted',
 *         retries: 2
 *       }
 *     );
 *   };
 *   
 *   // Method 3: Manual error handling
 *   const handleCustom = async () => {
 *     try {
 *       await someOperation();
 *     } catch (error) {
 *       handleError(error as Error);
 *     }
 *   };
 * };
 */