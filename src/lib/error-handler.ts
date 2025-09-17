import { supabase } from '@/integrations/supabase/client';

// Error types for categorization
export enum ErrorType {
  NETWORK = 'network',
  CAMERA = 'camera',
  QR_VALIDATION = 'qr_validation',
  PERMISSION = 'permission',
  DATABASE = 'database',
  UNKNOWN = 'unknown'
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

interface ErrorDetails {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  code?: string;
  timestamp: string;
  userId?: string;
  deviceInfo?: string;
  stackTrace?: string;
  context?: Record<string, any>;
}

interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

class ErrorHandler {
  private static instance: ErrorHandler;
  private errorQueue: ErrorDetails[] = [];
  private isOnline: boolean = navigator.onLine;
  private retryConfigs: Map<ErrorType, RetryConfig> = new Map();

  private constructor() {
    this.initializeRetryConfigs();
    this.setupNetworkListeners();
    this.startErrorQueueProcessor();
  }

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  private initializeRetryConfigs(): void {
    this.retryConfigs.set(ErrorType.NETWORK, {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffFactor: 2
    });

    this.retryConfigs.set(ErrorType.CAMERA, {
      maxAttempts: 2,
      baseDelay: 2000,
      maxDelay: 5000,
      backoffFactor: 1.5
    });

    this.retryConfigs.set(ErrorType.QR_VALIDATION, {
      maxAttempts: 1,
      baseDelay: 500,
      maxDelay: 1000,
      backoffFactor: 1
    });

    this.retryConfigs.set(ErrorType.DATABASE, {
      maxAttempts: 3,
      baseDelay: 1500,
      maxDelay: 8000,
      backoffFactor: 2.5
    });
  }

  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processErrorQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  private startErrorQueueProcessor(): void {
    setInterval(() => {
      if (this.isOnline && this.errorQueue.length > 0) {
        this.processErrorQueue();
      }
    }, 30000); // Process every 30 seconds
  }

  /**
   * Log an error with automatic categorization and retry logic
   */
  public async logError(
    error: Error | string,
    type: ErrorType = ErrorType.UNKNOWN,
    context?: Record<string, any>
  ): Promise<void> {
    const errorDetails: ErrorDetails = {
      type,
      severity: this.calculateSeverity(type, error),
      message: typeof error === 'string' ? error : error.message,
      code: this.extractErrorCode(error),
      timestamp: new Date().toISOString(),
      userId: await this.getCurrentUserId(),
      deviceInfo: this.getDeviceInfo(),
      stackTrace: typeof error !== 'string' ? error.stack : undefined,
      context
    };

    console.error('🚨 Error logged:', errorDetails);

    // Immediate handling for critical errors
    if (errorDetails.severity === ErrorSeverity.CRITICAL) {
      await this.handleCriticalError(errorDetails);
    }

    // Queue for batch processing
    this.errorQueue.push(errorDetails);

    // Try to send immediately if online
    if (this.isOnline) {
      await this.processErrorQueue();
    }
  }

  /**
   * Execute a function with automatic retry logic
   */
  public async withRetry<T>(
    operation: () => Promise<T>,
    errorType: ErrorType = ErrorType.UNKNOWN,
    customConfig?: Partial<RetryConfig>
  ): Promise<T> {
    const config = { ...this.retryConfigs.get(errorType), ...customConfig };
    let lastError: Error;
    
    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        await this.logError(lastError, errorType, {
          attempt,
          maxAttempts: config.maxAttempts
        });

        if (attempt === config.maxAttempts) {
          throw lastError;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffFactor, attempt - 1),
          config.maxDelay
        );

        await this.sleep(delay);
      }
    }
    
    throw lastError!;
  }

  /**
   * Handle camera-specific errors with recovery suggestions
   */
  public async handleCameraError(error: Error): Promise<{
    canRecover: boolean;
    suggestions: string[];
    errorType: ErrorType;
  }> {
    await this.logError(error, ErrorType.CAMERA);

    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('notallowederror') || errorMessage.includes('permission')) {
      return {
        canRecover: true,
        suggestions: [
          'Click the camera icon in your browser\\'s address bar',
          'Select \"Allow\" for camera permissions',
          'Refresh the page and try again',
          'Check your browser\\'s privacy settings'
        ],
        errorType: ErrorType.PERMISSION
      };
    }

    if (errorMessage.includes('notfounderror') || errorMessage.includes('no camera')) {
      return {
        canRecover: false,
        suggestions: [
          'Ensure your camera is connected and working',
          'Close other applications using the camera',
          'Try refreshing the page',
          'Use manual entry as an alternative'
        ],
        errorType: ErrorType.CAMERA
      };
    }

    if (errorMessage.includes('notreadableerror') || errorMessage.includes('in use')) {
      return {
        canRecover: true,
        suggestions: [
          'Close other camera applications (Zoom, Skype, etc.)',
          'Close other browser tabs using the camera',
          'Restart your browser',
          'Wait a moment and try again'
        ],
        errorType: ErrorType.CAMERA
      };
    }

    return {
      canRecover: false,
      suggestions: [
        'Try refreshing the page',
        'Use a different browser',
        'Contact support if the problem persists'
      ],
      errorType: ErrorType.CAMERA
    };
  }

  /**
   * Handle QR validation errors with specific guidance
   */
  public async handleQRValidationError(
    error: string,
    qrData?: string
  ): Promise<{
    canRetry: boolean;
    userMessage: string;
    technicalDetails: string;
  }> {
    await this.logError(error, ErrorType.QR_VALIDATION, { qrData });

    if (error.includes('invalid format') || error.includes('missing required fields')) {
      return {
        canRetry: false,
        userMessage: 'This QR code is not valid for event check-in. Please ensure you\\'re scanning the correct event QR code.',
        technicalDetails: 'QR code format validation failed'
      };
    }

    if (error.includes('signature') || error.includes('hash')) {
      return {
        canRetry: false,
        userMessage: 'This QR code appears to be tampered with or corrupted. Please request a new QR code from the event organizer.',
        technicalDetails: 'Cryptographic signature validation failed'
      };
    }

    if (error.includes('time window') || error.includes('expired')) {
      return {
        canRetry: false,
        userMessage: 'This QR code is outside the valid check-in time window. Check-in is only available from 1 hour before to 1 hour after the event.',
        technicalDetails: 'Time window validation failed'
      };
    }

    if (error.includes('replay') || error.includes('recently scanned')) {
      return {
        canRetry: true,
        userMessage: 'This QR code was recently scanned. Please wait a moment and try again, or check if you\\'ve already checked in.',
        technicalDetails: 'Replay protection triggered'
      };
    }

    return {
      canRetry: true,
      userMessage: 'There was an issue validating the QR code. Please try scanning again.',
      technicalDetails: error
    };
  }

  /**
   * Handle network errors with connection recovery
   */
  public async handleNetworkError(error: Error): Promise<{
    isTemporary: boolean;
    retryAfter: number;
    suggestions: string[];
  }> {
    await this.logError(error, ErrorType.NETWORK);

    const isConnectionError = error.message.includes('network') || 
                             error.message.includes('fetch') ||
                             error.message.includes('timeout');

    if (isConnectionError) {
      return {
        isTemporary: true,
        retryAfter: 5000,
        suggestions: [
          'Check your internet connection',
          'Try again in a few moments',
          'Move to an area with better signal if using mobile data'
        ]
      };
    }

    return {
      isTemporary: false,
      retryAfter: 0,
      suggestions: [
        'Check your internet connection',
        'Contact your network administrator',
        'Try using a different network'
      ]
    };
  }

  private calculateSeverity(type: ErrorType, error: Error | string): ErrorSeverity {
    const message = typeof error === 'string' ? error : error.message;
    
    if (type === ErrorType.PERMISSION && message.includes('camera')) {
      return ErrorSeverity.HIGH;
    }
    
    if (type === ErrorType.NETWORK && message.includes('timeout')) {
      return ErrorSeverity.MEDIUM;
    }
    
    if (type === ErrorType.QR_VALIDATION && message.includes('signature')) {
      return ErrorSeverity.HIGH;
    }
    
    if (type === ErrorType.DATABASE) {
      return ErrorSeverity.HIGH;
    }
    
    return ErrorSeverity.MEDIUM;
  }

  private extractErrorCode(error: Error | string): string | undefined {
    if (typeof error === 'string') return undefined;
    
    // Extract error codes from common error formats
    const codeMatch = error.message.match(/\\b[A-Z0-9_]{4,}\\b/);
    return codeMatch ? codeMatch[0] : undefined;
  }

  private async getCurrentUserId(): Promise<string | undefined> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id;
    } catch {
      return undefined;
    }
  }

  private getDeviceInfo(): string {
    return `${navigator.userAgent} | ${window.screen.width}x${window.screen.height} | ${navigator.language}`;
  }

  private async handleCriticalError(errorDetails: ErrorDetails): Promise<void> {
    // Implement critical error handling (e.g., immediate notification to admins)
    console.error('🚨 CRITICAL ERROR:', errorDetails);
    
    // Could implement:
    // - Send to error reporting service
    // - Notify administrators
    // - Trigger fallback systems
  }

  private async processErrorQueue(): Promise<void> {
    const batchSize = 10;
    const batch = this.errorQueue.splice(0, batchSize);
    
    if (batch.length === 0) return;

    try {
      // Here you would send errors to your logging service
      // For now, we'll just log them
      console.log('📤 Processing error batch:', batch.length, 'errors');
      
      // Could implement:
      // - Send to Supabase
      // - Send to external error tracking service
      // - Store in local storage for later retry
      
    } catch (error) {
      // Put errors back in queue if sending fails
      this.errorQueue.unshift(...batch);
      console.error('Failed to process error queue:', error);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Test network connectivity
   */
  public async testConnectivity(): Promise<{
    isOnline: boolean;
    latency?: number;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache'
      });
      
      return {
        isOnline: response.ok,
        latency: Date.now() - startTime
      };
    } catch (error) {
      return {
        isOnline: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get error statistics for debugging
   */
  public getErrorStats(): {
    queueLength: number;
    isOnline: boolean;
    errorsByType: Record<string, number>;
  } {
    const errorsByType: Record<string, number> = {};
    
    this.errorQueue.forEach(error => {
      errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
    });

    return {
      queueLength: this.errorQueue.length,
      isOnline: this.isOnline,
      errorsByType
    };
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();

// Convenience functions
export const logError = (error: Error | string, type?: ErrorType, context?: Record<string, any>) => 
  errorHandler.logError(error, type, context);

export const withRetry = <T>(operation: () => Promise<T>, errorType?: ErrorType, config?: Partial<RetryConfig>) => 
  errorHandler.withRetry(operation, errorType, config);

export const handleCameraError = (error: Error) => 
  errorHandler.handleCameraError(error);

export const handleQRValidationError = (error: string, qrData?: string) => 
  errorHandler.handleQRValidationError(error, qrData);

export const handleNetworkError = (error: Error) => 
  errorHandler.handleNetworkError(error);