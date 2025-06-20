
"use client"

// Inspired by react-hot-toast library
import * as React from "react"

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000 // Time in ms to remove the toast from memory after it's visually closed

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>() // For TOAST_REMOVE_DELAY
const autoDismissTimeouts = new Map<string, ReturnType<typeof setTimeout>>(); // For auto-dismissal duration

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST": {
       // Clear timeout for any toast that is being replaced due to TOAST_LIMIT
      const toastsToRemove: ToasterToast[] = [];
      if (state.toasts.length >= TOAST_LIMIT) {
        // Identify toasts that will be sliced off
        for (let i = TOAST_LIMIT - 1; i < state.toasts.length; i++) {
            toastsToRemove.push(state.toasts[i]!);
        }
      }
      // Add the new toast and slice
      const newToasts = [action.toast, ...state.toasts].slice(0, TOAST_LIMIT);

      // For any toast that was actually removed from the array by the slice, clear its auto-dismiss timeout
      const currentToastIds = new Set(newToasts.map(t => t.id));
      state.toasts.forEach(oldToast => {
        if (!currentToastIds.has(oldToast.id)) { // This toast was removed
            if (autoDismissTimeouts.has(oldToast.id)) {
                clearTimeout(autoDismissTimeouts.get(oldToast.id)!);
                autoDismissTimeouts.delete(oldToast.id);
            }
        }
      });
      
      return {
        ...state,
        toasts: newToasts,
      };
    }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      if (toastId) {
        // The autoDismissTimeout should have been cleared by the dismiss() function itself
        // before this action is dispatched.
        addToRemoveQueue(toastId)
      } else {
        // Dismiss all toasts
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
          if (autoDismissTimeouts.has(toast.id)) {
            clearTimeout(autoDismissTimeouts.get(toast.id)!);
            autoDismissTimeouts.delete(toast.id);
          }
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case "REMOVE_TOAST": {
      if (action.toastId) {
        if (autoDismissTimeouts.has(action.toastId)) {
          clearTimeout(autoDismissTimeouts.get(action.toastId)!);
          autoDismissTimeouts.delete(action.toastId);
        }
         if (toastTimeouts.has(action.toastId)) { // Clear the removal queue timeout too
          clearTimeout(toastTimeouts.get(action.toastId)!);
          toastTimeouts.delete(action.toastId);
        }
      } else { // Removing all toasts
        autoDismissTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
        autoDismissTimeouts.clear();
        toastTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
        toastTimeouts.clear();
      }

      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
    }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type Toast = Omit<ToasterToast, "id"> & {
  duration?: number; // Optional duration for auto-dismissal
};

function toast({ duration = 5000, ...props }: Toast) { // Default duration 5 seconds
  const id = genId()

  const update = (newProps: Partial<ToasterToast>) => { // Make newProps Partial<ToasterToast>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...newProps, id },
    });
    // If duration is updated, existing timeout needs to be cleared and reset
    // This is a more advanced update case, for now, update won't reset the auto-dismiss timer
    // unless the toast component itself is re-rendered with a new duration prop (which it isn't directly)
  }

  // Wrapped dismiss function that also clears the auto-dismiss timeout
  const dismiss = () => {
    if (autoDismissTimeouts.has(id)) {
      clearTimeout(autoDismissTimeouts.get(id)!);
      autoDismissTimeouts.delete(id);
    }
    dispatch({ type: "DISMISS_TOAST", toastId: id });
  };

  // Before adding new toast, clear existing auto-dismiss timeout for this ID if any
  // This handles rapid calls to toast() that might try to create multiple timeouts for the same toast ID
  // (though genId should make IDs unique, this is defensive for potential race conditions if not)
  if (autoDismissTimeouts.has(id)) {
      clearTimeout(autoDismissTimeouts.get(id)!);
      autoDismissTimeouts.delete(id);
  }

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) {
          // This is called when the Toast component itself signals it wants to close
          // (e.g. user manually closed it via swipe or close button if present)
          // We must ensure our managed dismiss (which clears timeout) is called.
          dismiss();
        }
      },
    },
  })

  const timeoutId = setTimeout(dismiss, duration);
  autoDismissTimeouts.set(id, timeoutId);

  return {
    id: id,
    dismiss,
    update,
  }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => {
      if (toastId && autoDismissTimeouts.has(toastId)) {
         clearTimeout(autoDismissTimeouts.get(toastId)!);
         autoDismissTimeouts.delete(toastId);
      } else if (!toastId) { // Dismiss all
        autoDismissTimeouts.forEach(timeout => clearTimeout(timeout));
        autoDismissTimeouts.clear();
      }
      dispatch({ type: "DISMISS_TOAST", toastId })
    },
  }
}

export { useToast, toast }
