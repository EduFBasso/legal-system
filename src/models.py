"""
Database models for Legal System
Following Brazilian legal standards
"""

from datetime import datetime
from enum import Enum
from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from src.database import Base


class ClientType(str, Enum):
    """Client type classification"""
    PERSON = "Pessoa Física"
    LEGAL_ENTITY = "Pessoa Jurídica"


class CaseStatus(str, Enum):
    """Case status classification"""
    PENDING = "Pendente"
    IN_PROGRESS = "Em Andamento"
    CONCLUDED = "Concluído"
    SUSPENDED = "Suspenso"
    ARCHIVED = "Arquivado"


class CasePriority(str, Enum):
    """Case priority levels"""
    LOW = "Baixa"
    NORMAL = "Normal"
    HIGH = "Alta"
    URGENT = "Urgente"


class Client(Base):
    """
    Client model - Dados do Cliente
    """
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    
    # Dados Pessoais / Identificação
    name = Column(String(255), nullable=False, index=True)
    client_type = Column(SQLEnum(ClientType), nullable=False)
    
    # Pessoa Física
    cpf = Column(String(11), unique=True, nullable=True, index=True)  # sem formatação
    rg = Column(String(20), nullable=True)
    profession = Column(String(100), nullable=True)
    marital_status = Column(String(50), nullable=True)  # Solteiro, Casado, Divorciado, Viúvo
    
    # Pessoa Jurídica
    cnpj = Column(String(14), unique=True, nullable=True, index=True)  # sem formatação
    company_name = Column(String(255), nullable=True)
    legal_representative = Column(String(255), nullable=True)
    
    # Contato
    phone = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True, index=True)
    
    # Endereço
    address = Column(String(255), nullable=True)
    number = Column(String(20), nullable=True)
    complement = Column(String(100), nullable=True)
    neighborhood = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(2), nullable=True)
    zipcode = Column(String(8), nullable=True)  # sem formatação
    
    # Informações Adicionais
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    cases = relationship("Case", back_populates="client", cascade="all, delete-orphan")


class Case(Base):
    """
    Case model - Processo Jurídico
    """
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    
    # Identificação do Processo
    case_number = Column(String(50), unique=True, nullable=False, index=True)  # Formato: 0000000-00.0000.0.00.0000
    case_type = Column(String(100), nullable=False)  # Ação Ordinária, Ação Cautelar, Execução, etc
    
    # Partes
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False, index=True)
    opposing_party = Column(String(255), nullable=False)
    
    # Dados Processuais
    description = Column(Text, nullable=True)  # Descrição do caso
    status = Column(SQLEnum(CaseStatus), default=CaseStatus.PENDING, nullable=False, index=True)
    priority = Column(SQLEnum(CasePriority), default=CasePriority.NORMAL, nullable=False)
    
    # Foro
    court = Column(String(255), nullable=False)  # Nome do tribunal
    judge = Column(String(255), nullable=True)
    legal_area = Column(String(100), nullable=True)  # Cível, Criminal, Trabalhista, etc
    
    # Datas Importantes
    filing_date = Column(Date, nullable=True)  # Data de distribuição
    deadline = Column(Date, nullable=True)  # Próxima data importante
    conclusion_date = Column(Date, nullable=True)
    
    # Valor da Causa
    claim_value = Column(String(50), nullable=True)  # Armazenar como string para evitar problemas de precisão
    
    # Controle
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    client = relationship("Client", back_populates="cases")
    notices = relationship("Notice", back_populates="case", cascade="all, delete-orphan")


class Notice(Base):
    """
    Notice model - Avisos e Prazos
    """
    __tablename__ = "notices"

    id = Column(Integer, primary_key=True, index=True)
    
    # Identificação
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Datas
    due_date = Column(Date, nullable=False, index=True)
    notification_date = Column(DateTime, nullable=True)
    completed_date = Column(DateTime, nullable=True)
    
    # Status
    is_completed = Column(Integer, default=0, nullable=False)  # 0 = False, 1 = True para SQLite
    
    # Controle
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    case = relationship("Case", back_populates="notices")
