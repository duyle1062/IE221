from decouple import config

print("=" * 50)
print("Testing .env with python-decouple:")
print("=" * 50)
print(f"DB_NAME: {config('DB_NAME')}")
print(f"DB_USER: {config('DB_USER')}")
print(f"DB_HOST: {config('DB_HOST', default='localhost')}")
print(f"DB_PORT: {config('DB_PORT', default='5432')}")
print("=" * 50)