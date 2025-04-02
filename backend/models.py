# backend/models.py
from pydantic import BaseModel, Field, validator
from typing import Literal, Optional
from datetime import datetime
from bson import ObjectId # Import ObjectId from bson library (installed with motor)

# --- Helper for MongoDB ObjectId ---
# Pydantic doesn't natively handle MongoDB's ObjectId, so we add a validator/serializer.
class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")


# --- Song Suggestion Models ---

# Base model with common fields
class SongSuggestionBase(BaseModel):
    spotify_uri: str = Field(..., example="spotify:track:0VjIjW4GlUZAMYd2vXMi3b")
    song_name: str = Field(..., example="Blinding Lights")
    artist_name: str = Field(..., example="The Weeknd")
    album_cover_url: Optional[str] = Field(None, example="https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36")
    class_id: str = Field(..., example="class_123abc") # ID from Barry's system

# Model for creating a suggestion (input to API)
class SongSuggestionCreate(SongSuggestionBase):
    # participant_id will be added based on authentication later
    pass

# Model representing the data structure in MongoDB
class SongSuggestionInDB(SongSuggestionBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id") # Maps MongoDB _id to id
    participant_id: str = Field(..., example="user_789xyz") # Added when saving
    instructor_id: str = Field(..., example="instructor_456def") # Added when saving (from class lookup?)
    suggestion_date: datetime = Field(default_factory=datetime.utcnow)
    status: Literal['pending', 'approved', 'rejected'] = 'pending'

    class Config:
        allow_population_by_field_name = True # Allows using '_id' when creating instance
        arbitrary_types_allowed = True # Necessary for PyObjectId
        json_encoders = {ObjectId: str} # Serialize ObjectId to string in JSON responses


# Model for updating the status
class SongSuggestionUpdateStatus(BaseModel):
    status: Literal['approved', 'rejected']


# --- Quota Record Models ---

# Base model for quota info
class QuotaRecordBase(BaseModel):
    user_id: str = Field(..., example="user_789xyz")
    month_year: str = Field(..., example="2025-03") # Format YYYY-MM
    total_quota: int = Field(..., ge=0, example=5) # Must be >= 0
    remaining_quota: int = Field(..., ge=0, example=3) # Must be >= 0

    @validator('remaining_quota')
    def remaining_must_be_less_than_or_equal_to_total(cls, v, values):
        if 'total_quota' in values and v > values['total_quota']:
            raise ValueError('remaining_quota cannot be greater than total_quota')
        return v

# Model for creating/updating a quota record (input to internal logic)
class QuotaRecordCreate(QuotaRecordBase):
    pass

# Model representing the data structure in MongoDB
class QuotaRecordInDB(QuotaRecordBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
