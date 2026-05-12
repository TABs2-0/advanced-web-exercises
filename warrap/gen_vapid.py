from pywebpush import Vapid
v = Vapid()
v.generate_keys()
print(v.public_key.serialize().decode())
print(v.private_key.serialize().decode())