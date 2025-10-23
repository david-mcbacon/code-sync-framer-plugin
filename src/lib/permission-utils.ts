import { framer, ProtectedMethod } from "framer-plugin";

type PermissionAction<T> = () => Promise<T> | T;

interface WithPermissionOptions<T> {
  permission: ProtectedMethod;
  action: PermissionAction<T>;
  successMessage?: string;
  errorMessage?: string;
}

export async function withPermission<T>(
  props: WithPermissionOptions<T>
): Promise<T | undefined> {
  if (framer.isAllowedTo(props.permission)) {
    try {
      const result = await props.action();
      if (props.successMessage) {
        framer.notify(props.successMessage, {
          variant: "success",
        });
      }
      return result;
    } catch (error) {
      console.error(error);
      framer.notify(
        error instanceof Error ? error.message : "An error occurred.",
        {
          variant: "error",
        }
      );
      return undefined;
    }
  } else {
    framer.notify(
      props.errorMessage || "You don't have permission to perform this action.",
      {
        variant: "error",
      }
    );
    return undefined;
  }
}
