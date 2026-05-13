from pydantic import BaseModel

class MatterCreate(BaseModel):
    client_name: str
    case_type: str
    assigned_attorney: str
    status: str
    priority: str

class MatterResponse(BaseModel):
    id: int
    client_name: str
    case_type: str
    assigned_attorney: str
    status: str
    priority: str

    class Config:
        from_attributes = True