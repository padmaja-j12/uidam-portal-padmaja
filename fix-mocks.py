import sys

filepath = r"d:\React JS\UIDAM-React\uidam-ecsp\uidam-portal-padmaja\src\features\user-management\UserManagement.test.tsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace all occurrences
content = content.replace('mockFilterUsersV2', '(UserService.filterUsersV2 as jest.Mock)')
content = content.replace('mockfilterUsersV2', '(UserService.filterUsersV2 as jest.Mock)')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully replaced all mock references")
