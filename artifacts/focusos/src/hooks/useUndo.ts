import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';

export function useUndo<T>(
  action: (item: T) => void,
  restore: (item: T) => void,
  toastMessage: string,
  delay: number = 5000
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const execute = useCallback(
    (item: T) => {
      action(item);

      toast.success(toastMessage, {
        duration: delay,
        action: {
          label: 'Undo',
          onClick: () => {
            restore(item);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
          },
        },
      });
    },
    [action, restore, toastMessage, delay]
  );

  return execute;
}
