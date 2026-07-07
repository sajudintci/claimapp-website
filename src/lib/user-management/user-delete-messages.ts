export function mapUserSaveErrorMessage(message: string): string {
  const normalized = message.trim();
  const map: Record<string, string> = {
    "Validation failed": "Please check the form fields and try again.",
    VALIDATION_ERROR: "Please check the form fields and try again.",
    "Email is already registered": "That email is already used by an active account.",
    EMAIL_ALREADY_EXISTS: "That email is already used by an active account.",
    "Department not found in your organization": "Selected department is no longer available.",
    DEPARTMENT_NOT_FOUND: "Selected department is no longer available.",
    "At least one role is required": "Select at least one role for this user.",
    ROLE_REQUIRED: "Select at least one role for this user.",
    "One or more roles are invalid": "One or more selected roles are no longer available.",
    ROLE_NOT_FOUND: "One or more selected roles are no longer available.",
    "Internal server error": "Something went wrong while saving. Please try again.",
    INTERNAL_SERVER_ERROR: "Something went wrong while saving. Please try again.",
  };

  return map[normalized] ?? (normalized || "Failed to save user. Please try again.");
}

export function mapUserDeleteErrorMessage(message: string): string {
  const normalized = message.trim();
  const map: Record<string, string> = {
    "You cannot delete your own account":
      "You cannot remove your own account. Ask another admin to deactivate it if needed.",
    CANNOT_DELETE_SELF:
      "You cannot remove your own account. Ask another admin to deactivate it if needed.",
    "User not found": "This user no longer exists or was already removed.",
    USER_NOT_FOUND: "This user no longer exists or was already removed.",
  };

  return map[normalized] ?? (normalized || "Failed to deactivate user. Please try again.");
}

export function mapDepartmentDeleteErrorMessage(message: string): string {
  const normalized = message.trim();
  if (
    normalized.includes("still has assigned users") ||
    normalized === "DEPARTMENT_IN_USE"
  ) {
    return "This department still has assigned users. Reassign them before deleting.";
  }

  const map: Record<string, string> = {
    "Department not found": "This department no longer exists.",
    DEPARTMENT_NOT_FOUND: "This department no longer exists.",
  };

  return map[normalized] ?? (normalized || "Failed to delete department. Please try again.");
}
