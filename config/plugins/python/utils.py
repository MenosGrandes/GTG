import random
import string

def random_string(n):
    return ''.join(random.choices(string.ascii_lowercase, k=n))

def random_int(min_val, max_val):
    return random.randint(min_val, max_val - 1)
