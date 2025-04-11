# Community Goals: Edit and Delete Functionality

## Overview

The community goals feature allows users to create, edit, and delete community-focused objectives in the application. This document outlines the implementation of the edit and delete functionalities.

## Edit Functionality

### User Flow

1. The user navigates to a community goal details page (`/dashboard/community-goals/[goalId]`)
2. If the user is the owner of the goal, they see "Edit Goal" and "Delete" buttons
3. Clicking "Edit Goal" navigates to `/dashboard/community-goals/edit/[goalId]`
4. The edit page loads existing goal data and allows modifications to relevant fields
5. On submission, the changes are saved and the user is redirected back to the goal details page

### Technical Implementation

- **Route Parameters**: The edit page uses the `[goalId]` parameter to identify which goal to edit
- **Form Pre-Population**: The form loads and pre-populates with data from the existing goal
- **Data Validation**: Before submission, the form data is validated (required fields, proper formats)
- **API Integration**: The edit page sends a PUT request to `/api/community-goals/[goalId]` with the updated data
- **Error Handling**: The edit page handles network errors, validation errors, and other potential issues
- **Security**: Only goal owners can edit their goals, verified at both frontend and API levels

### Limitations

- Task editing is currently not supported directly through the edit page
- Goal type cannot be changed after creation to maintain data consistency

## Delete Functionality

### User Flow

1. From the goal details page, the owner can click "Delete"
2. A confirmation dialog appears asking the user to confirm the deletion
3. Upon confirmation, the goal is deleted and the user is redirected to the goals listing page

### Technical Implementation

- **API Integration**: Sends a DELETE request to `/api/community-goals/[goalId]`
- **Confirmation Dialog**: Uses a browser confirmation to prevent accidental deletions
- **Redirection**: Upon successful deletion, redirects to `/dashboard/community-goals`
- **Security**: Only goal owners can delete goals, verified at the API level

## API Endpoints

### PUT /api/community-goals/[goalId]

Updates a specific community goal

- **Authentication**: Required
- **Authorization**: Only the goal creator can update
- **Request Body**: Contains updated goal data (title, description, status, etc.)
- **Response**: Returns the updated goal or an error

### DELETE /api/community-goals/[goalId]

Deletes a specific community goal

- **Authentication**: Required
- **Authorization**: Only the goal creator can delete
- **Response**: Success message or error

## Future Enhancements

- Add the ability to edit tasks
- Implement a draft/review mode before publishing changes
- Add batch operations for managing multiple goals
- Implement soft deletion with recovery options
