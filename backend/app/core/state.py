from dataclasses import dataclass


@dataclass
class State:
    tokens: set[str]
    cookies: set[str]


state = State(tokens=set(), cookies=set())