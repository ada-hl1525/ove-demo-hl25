from sqlalchemy import Column, String

from app.db.session import Base


class DictMixin:
    def to_dict(self):
        return {
            column.name: getattr(self, column.name)
            for column in self.__table__.columns
        }


class APIKey(Base):
    __tablename__ = "api_keys"
    id = Column(String, primary_key=True)