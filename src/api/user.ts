export const updateUser = async (data: any) => {
  // 實作更新用戶的邏輯
  const response = await fetch('/api/user', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return response.json();
}; 