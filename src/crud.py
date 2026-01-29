"""
CRUD operations for database models
"""

from datetime import datetime, date
from typing import List, Optional
from sqlalchemy.orm import Session
from src.models import Client, Case, Notice, ClientType, CaseStatus, CasePriority


class ClientCRUD:
    """CRUD operations for Client model"""
    
    @staticmethod
    def create(db: Session, name: str, client_type: str, **kwargs) -> Client:
        """Create a new client"""
        db_client = Client(
            name=name,
            client_type=ClientType(client_type),
            **kwargs
        )
        db.add(db_client)
        db.commit()
        db.refresh(db_client)
        return db_client
    
    @staticmethod
    def read(db: Session, client_id: int) -> Optional[Client]:
        """Get client by ID"""
        return db.query(Client).filter(Client.id == client_id).first()
    
    @staticmethod
    def read_by_cpf(db: Session, cpf: str) -> Optional[Client]:
        """Get client by CPF"""
        return db.query(Client).filter(Client.cpf == cpf).first()
    
    @staticmethod
    def read_by_cnpj(db: Session, cnpj: str) -> Optional[Client]:
        """Get client by CNPJ"""
        return db.query(Client).filter(Client.cnpj == cnpj).first()
    
    @staticmethod
    def read_by_email(db: Session, email: str) -> Optional[Client]:
        """Get client by email"""
        return db.query(Client).filter(Client.email == email).first()
    
    @staticmethod
    def read_all(db: Session, skip: int = 0, limit: int = 100) -> List[Client]:
        """Get all clients with pagination"""
        return db.query(Client).offset(skip).limit(limit).all()
    
    @staticmethod
    def search(db: Session, query: str) -> List[Client]:
        """Search clients by name or CPF/CNPJ"""
        return db.query(Client).filter(
            (Client.name.ilike(f"%{query}%")) |
            (Client.cpf == query) |
            (Client.cnpj == query)
        ).all()
    
    @staticmethod
    def update(db: Session, client_id: int, **kwargs) -> Optional[Client]:
        """Update client"""
        db_client = ClientCRUD.read(db, client_id)
        if db_client:
            kwargs['updated_at'] = datetime.utcnow()
            for key, value in kwargs.items():
                if hasattr(db_client, key):
                    setattr(db_client, key, value)
            db.commit()
            db.refresh(db_client)
        return db_client
    
    @staticmethod
    def delete(db: Session, client_id: int) -> bool:
        """Delete client"""
        db_client = ClientCRUD.read(db, client_id)
        if db_client:
            db.delete(db_client)
            db.commit()
            return True
        return False


class CaseCRUD:
    """CRUD operations for Case model"""
    
    @staticmethod
    def create(db: Session, case_number: str, client_id: int, case_type: str, 
               opposing_party: str, court: str, **kwargs) -> Case:
        """Create a new case"""
        db_case = Case(
            case_number=case_number,
            client_id=client_id,
            case_type=case_type,
            opposing_party=opposing_party,
            court=court,
            **kwargs
        )
        db.add(db_case)
        db.commit()
        db.refresh(db_case)
        return db_case
    
    @staticmethod
    def read(db: Session, case_id: int) -> Optional[Case]:
        """Get case by ID"""
        return db.query(Case).filter(Case.id == case_id).first()
    
    @staticmethod
    def read_by_case_number(db: Session, case_number: str) -> Optional[Case]:
        """Get case by case number"""
        return db.query(Case).filter(Case.case_number == case_number).first()
    
    @staticmethod
    def read_by_client(db: Session, client_id: int) -> List[Case]:
        """Get all cases for a specific client"""
        return db.query(Case).filter(Case.client_id == client_id).all()
    
    @staticmethod
    def read_all(db: Session, skip: int = 0, limit: int = 100) -> List[Case]:
        """Get all cases with pagination"""
        return db.query(Case).offset(skip).limit(limit).all()
    
    @staticmethod
    def read_by_status(db: Session, status: str) -> List[Case]:
        """Get cases by status"""
        return db.query(Case).filter(Case.status == CaseStatus(status)).all()
    
    @staticmethod
    def read_urgent(db: Session) -> List[Case]:
        """Get urgent and high priority cases"""
        return db.query(Case).filter(
            (Case.priority == CasePriority.URGENT) |
            (Case.priority == CasePriority.HIGH)
        ).order_by(Case.deadline).all()
    
    @staticmethod
    def search(db: Session, query: str) -> List[Case]:
        """Search cases by number or opponent party"""
        return db.query(Case).filter(
            (Case.case_number.ilike(f"%{query}%")) |
            (Case.opposing_party.ilike(f"%{query}%"))
        ).all()
    
    @staticmethod
    def update(db: Session, case_id: int, **kwargs) -> Optional[Case]:
        """Update case"""
        db_case = CaseCRUD.read(db, case_id)
        if db_case:
            kwargs['updated_at'] = datetime.utcnow()
            for key, value in kwargs.items():
                if hasattr(db_case, key):
                    setattr(db_case, key, value)
            db.commit()
            db.refresh(db_case)
        return db_case
    
    @staticmethod
    def delete(db: Session, case_id: int) -> bool:
        """Delete case"""
        db_case = CaseCRUD.read(db, case_id)
        if db_case:
            db.delete(db_case)
            db.commit()
            return True
        return False


class NoticeCRUD:
    """CRUD operations for Notice model"""
    
    @staticmethod
    def create(db: Session, case_id: int, title: str, due_date: date, **kwargs) -> Notice:
        """Create a new notice"""
        db_notice = Notice(
            case_id=case_id,
            title=title,
            due_date=due_date,
            **kwargs
        )
        db.add(db_notice)
        db.commit()
        db.refresh(db_notice)
        return db_notice
    
    @staticmethod
    def read(db: Session, notice_id: int) -> Optional[Notice]:
        """Get notice by ID"""
        return db.query(Notice).filter(Notice.id == notice_id).first()
    
    @staticmethod
    def read_by_case(db: Session, case_id: int) -> List[Notice]:
        """Get all notices for a specific case"""
        return db.query(Notice).filter(Notice.case_id == case_id).all()
    
    @staticmethod
    def read_pending(db: Session) -> List[Notice]:
        """Get all pending notices ordered by due date"""
        return db.query(Notice).filter(
            Notice.is_completed == 0
        ).order_by(Notice.due_date).all()
    
    @staticmethod
    def read_overdue(db: Session) -> List[Notice]:
        """Get overdue notices"""
        today = date.today()
        return db.query(Notice).filter(
            (Notice.is_completed == 0) &
            (Notice.due_date < today)
        ).order_by(Notice.due_date).all()
    
    @staticmethod
    def read_upcoming(db: Session, days: int = 7) -> List[Notice]:
        """Get notices due in the next N days"""
        from datetime import timedelta
        today = date.today()
        future_date = today + timedelta(days=days)
        return db.query(Notice).filter(
            (Notice.is_completed == 0) &
            (Notice.due_date >= today) &
            (Notice.due_date <= future_date)
        ).order_by(Notice.due_date).all()
    
    @staticmethod
    def update(db: Session, notice_id: int, **kwargs) -> Optional[Notice]:
        """Update notice"""
        db_notice = NoticeCRUD.read(db, notice_id)
        if db_notice:
            kwargs['updated_at'] = datetime.utcnow()
            for key, value in kwargs.items():
                if hasattr(db_notice, key):
                    setattr(db_notice, key, value)
            db.commit()
            db.refresh(db_notice)
        return db_notice
    
    @staticmethod
    def mark_completed(db: Session, notice_id: int) -> Optional[Notice]:
        """Mark notice as completed"""
        return NoticeCRUD.update(db, notice_id, is_completed=1, completed_date=datetime.utcnow())
    
    @staticmethod
    def delete(db: Session, notice_id: int) -> bool:
        """Delete notice"""
        db_notice = NoticeCRUD.read(db, notice_id)
        if db_notice:
            db.delete(db_notice)
            db.commit()
            return True
        return False
