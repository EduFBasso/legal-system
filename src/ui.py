"""
PySide6 UI for Client registration and management
Accessible design for low vision users
"""

from PySide6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QLabel, QLineEdit, QComboBox, QPushButton, QTableWidget, QTableWidgetItem,
    QTabWidget, QFormLayout, QMessageBox, QTextEdit, QSpinBox, QDateEdit,
    QDialog, QScrollArea
)
from PySide6.QtCore import Qt, QDate, QSize
from PySide6.QtGui import QFont, QColor, QPalette
from datetime import datetime, date
from sqlalchemy.orm import Session
from src.database import SessionLocal, init_db
from src.models import ClientType, CaseStatus, CasePriority
from src.crud import ClientCRUD, CaseCRUD, NoticeCRUD


class AccessibleConfig:
    """Accessible UI configuration for low vision users"""
    
    # Fonts
    FONT_LARGE = QFont("Arial", 16, QFont.Bold)
    FONT_NORMAL = QFont("Arial", 14)
    FONT_SMALL = QFont("Arial", 12)
    
    # Colors - High contrast
    BG_COLOR = QColor(255, 255, 255)  # White background
    TEXT_COLOR = QColor(0, 0, 0)      # Black text
    ACCENT_COLOR = QColor(0, 102, 204)  # Strong blue
    BUTTON_COLOR = QColor(51, 51, 51)  # Dark gray
    WARNING_COLOR = QColor(204, 0, 0)  # Strong red
    
    @staticmethod
    def apply_theme(widget):
        """Apply accessible theme to widget"""
        palette = widget.palette()
        palette.setColor(QPalette.Window, AccessibleConfig.BG_COLOR)
        palette.setColor(QPalette.WindowText, AccessibleConfig.TEXT_COLOR)
        palette.setColor(QPalette.Button, AccessibleConfig.BUTTON_COLOR)
        palette.setColor(QPalette.ButtonText, QColor(255, 255, 255))
        widget.setPalette(palette)


class ClientFormDialog(QDialog):
    """Dialog for creating/editing clients"""
    
    def __init__(self, parent=None, client=None, db: Session = None):
        super().__init__(parent)
        self.client = client
        self.db = db or SessionLocal()
        self.init_ui()
    
    def init_ui(self):
        """Initialize UI"""
        self.setWindowTitle("Cadastro de Cliente")
        self.setMinimumSize(600, 700)
        
        layout = QVBoxLayout()
        
        # Title
        title = QLabel("Cadastro de Cliente")
        title.setFont(AccessibleConfig.FONT_LARGE)
        layout.addWidget(title)
        
        # Form layout
        form = QFormLayout()
        form.setSpacing(15)
        
        # Cliente Type
        type_label = QLabel("Tipo de Cliente:")
        type_label.setFont(AccessibleConfig.FONT_NORMAL)
        self.type_combo = QComboBox()
        self.type_combo.addItems([ClientType.PERSON.value, ClientType.LEGAL_ENTITY.value])
        self.type_combo.setMinimumHeight(40)
        self.type_combo.setFont(AccessibleConfig.FONT_NORMAL)
        form.addRow(type_label, self.type_combo)
        
        # Name
        name_label = QLabel("Nome/Razão Social:")
        name_label.setFont(AccessibleConfig.FONT_NORMAL)
        self.name_input = QLineEdit()
        self.name_input.setMinimumHeight(40)
        self.name_input.setFont(AccessibleConfig.FONT_NORMAL)
        if self.client:
            self.name_input.setText(self.client.name)
        form.addRow(name_label, self.name_input)
        
        # CPF/CNPJ
        doc_label = QLabel("CPF/CNPJ:")
        doc_label.setFont(AccessibleConfig.FONT_NORMAL)
        self.doc_input = QLineEdit()
        self.doc_input.setMinimumHeight(40)
        self.doc_input.setFont(AccessibleConfig.FONT_NORMAL)
        form.addRow(doc_label, self.doc_input)
        
        # Email
        email_label = QLabel("Email:")
        email_label.setFont(AccessibleConfig.FONT_NORMAL)
        self.email_input = QLineEdit()
        self.email_input.setMinimumHeight(40)
        self.email_input.setFont(AccessibleConfig.FONT_NORMAL)
        form.addRow(email_label, self.email_input)
        
        # Phone
        phone_label = QLabel("Telefone:")
        phone_label.setFont(AccessibleConfig.FONT_NORMAL)
        self.phone_input = QLineEdit()
        self.phone_input.setMinimumHeight(40)
        self.phone_input.setFont(AccessibleConfig.FONT_NORMAL)
        form.addRow(phone_label, self.phone_input)
        
        # Address
        address_label = QLabel("Endereço:")
        address_label.setFont(AccessibleConfig.FONT_NORMAL)
        self.address_input = QLineEdit()
        self.address_input.setMinimumHeight(40)
        self.address_input.setFont(AccessibleConfig.FONT_NORMAL)
        form.addRow(address_label, self.address_input)
        
        # City/State/Zip
        city_label = QLabel("Cidade:")
        city_label.setFont(AccessibleConfig.FONT_NORMAL)
        self.city_input = QLineEdit()
        self.city_input.setMinimumHeight(40)
        self.city_input.setFont(AccessibleConfig.FONT_NORMAL)
        form.addRow(city_label, self.city_input)
        
        state_label = QLabel("Estado (UF):")
        state_label.setFont(AccessibleConfig.FONT_NORMAL)
        self.state_input = QLineEdit()
        self.state_input.setMaximumWidth(100)
        self.state_input.setMinimumHeight(40)
        self.state_input.setFont(AccessibleConfig.FONT_NORMAL)
        form.addRow(state_label, self.state_input)
        
        # Notes
        notes_label = QLabel("Observações:")
        notes_label.setFont(AccessibleConfig.FONT_NORMAL)
        self.notes_input = QTextEdit()
        self.notes_input.setMinimumHeight(100)
        self.notes_input.setFont(AccessibleConfig.FONT_NORMAL)
        form.addRow(notes_label, self.notes_input)
        
        layout.addLayout(form)
        
        # Buttons
        button_layout = QHBoxLayout()
        
        save_btn = QPushButton("Salvar")
        save_btn.setMinimumHeight(50)
        save_btn.setFont(AccessibleConfig.FONT_NORMAL)
        save_btn.clicked.connect(self.save_client)
        button_layout.addWidget(save_btn)
        
        cancel_btn = QPushButton("Cancelar")
        cancel_btn.setMinimumHeight(50)
        cancel_btn.setFont(AccessibleConfig.FONT_NORMAL)
        cancel_btn.clicked.connect(self.reject)
        button_layout.addWidget(cancel_btn)
        
        layout.addLayout(button_layout)
        
        self.setLayout(layout)
        AccessibleConfig.apply_theme(self)
    
    def save_client(self):
        """Save client to database"""
        try:
            name = self.name_input.text().strip()
            client_type = self.type_combo.currentText()
            email = self.email_input.text().strip() or None
            phone = self.phone_input.text().strip() or None
            
            if not name:
                QMessageBox.warning(self, "Erro", "Nome é obrigatório!")
                return
            
            if self.client:
                # Update
                ClientCRUD.update(
                    self.db,
                    self.client.id,
                    name=name,
                    email=email,
                    phone=phone,
                    address=self.address_input.text() or None,
                    city=self.city_input.text() or None,
                    state=self.state_input.text() or None,
                    notes=self.notes_input.toPlainText() or None
                )
            else:
                # Create
                ClientCRUD.create(
                    self.db,
                    name=name,
                    client_type=client_type,
                    email=email,
                    phone=phone,
                    address=self.address_input.text() or None,
                    city=self.city_input.text() or None,
                    state=self.state_input.text() or None,
                    notes=self.notes_input.toPlainText() or None
                )
            
            QMessageBox.information(self, "Sucesso", "Cliente salvo com sucesso!")
            self.accept()
        
        except Exception as e:
            QMessageBox.critical(self, "Erro", f"Erro ao salvar cliente: {str(e)}")


class ClientListWindow(QMainWindow):
    """Main window for client list and management"""
    
    def __init__(self):
        super().__init__()
        self.db = SessionLocal()
        init_db()
        self.init_ui()
    
    def init_ui(self):
        """Initialize UI"""
        self.setWindowTitle("Sistema Judiciário - Gestão de Clientes")
        self.setMinimumSize(1000, 600)
        
        # Central widget
        central = QWidget()
        layout = QVBoxLayout()
        
        # Title
        title = QLabel("Gestão de Clientes")
        title.setFont(AccessibleConfig.FONT_LARGE)
        layout.addWidget(title)
        
        # Search bar
        search_layout = QHBoxLayout()
        search_label = QLabel("Pesquisar:")
        search_label.setFont(AccessibleConfig.FONT_NORMAL)
        self.search_input = QLineEdit()
        self.search_input.setMinimumHeight(40)
        self.search_input.setFont(AccessibleConfig.FONT_NORMAL)
        search_btn = QPushButton("Buscar")
        search_btn.setMinimumHeight(40)
        search_btn.setMinimumWidth(150)
        search_btn.setFont(AccessibleConfig.FONT_NORMAL)
        search_btn.clicked.connect(self.search_clients)
        
        search_layout.addWidget(search_label)
        search_layout.addWidget(self.search_input)
        search_layout.addWidget(search_btn)
        layout.addLayout(search_layout)
        
        # Clients table
        self.table = QTableWidget()
        self.table.setColumnCount(5)
        self.table.setHorizontalHeaderLabels(["ID", "Nome", "Email", "Telefone", "Ações"])
        self.table.setMinimumHeight(400)
        self.table.setFont(AccessibleConfig.FONT_NORMAL)
        self.table.setRowHeight(0, 40)
        layout.addWidget(self.table)
        
        # Buttons
        button_layout = QHBoxLayout()
        
        new_client_btn = QPushButton("+ Novo Cliente")
        new_client_btn.setMinimumHeight(50)
        new_client_btn.setFont(AccessibleConfig.FONT_NORMAL)
        new_client_btn.clicked.connect(self.new_client)
        button_layout.addWidget(new_client_btn)
        
        refresh_btn = QPushButton("Atualizar")
        refresh_btn.setMinimumHeight(50)
        refresh_btn.setFont(AccessibleConfig.FONT_NORMAL)
        refresh_btn.clicked.connect(self.load_clients)
        button_layout.addWidget(refresh_btn)
        
        layout.addLayout(button_layout)
        
        central.setLayout(layout)
        self.setCentralWidget(central)
        AccessibleConfig.apply_theme(self)
        
        self.load_clients()
    
    def load_clients(self):
        """Load all clients into table"""
        self.table.setRowCount(0)
        clients = ClientCRUD.read_all(self.db, limit=1000)
        
        for row, client in enumerate(clients):
            self.table.insertRow(row)
            
            id_item = QTableWidgetItem(str(client.id))
            id_item.setFont(AccessibleConfig.FONT_NORMAL)
            self.table.setItem(row, 0, id_item)
            
            name_item = QTableWidgetItem(client.name)
            name_item.setFont(AccessibleConfig.FONT_NORMAL)
            self.table.setItem(row, 1, name_item)
            
            email_item = QTableWidgetItem(client.email or "")
            email_item.setFont(AccessibleConfig.FONT_NORMAL)
            self.table.setItem(row, 2, email_item)
            
            phone_item = QTableWidgetItem(client.phone or "")
            phone_item.setFont(AccessibleConfig.FONT_NORMAL)
            self.table.setItem(row, 3, phone_item)
            
            actions_item = QTableWidgetItem("Editar | Deletar")
            actions_item.setFont(AccessibleConfig.FONT_NORMAL)
            self.table.setItem(row, 4, actions_item)
            
            self.table.setRowHeight(row, 40)
    
    def new_client(self):
        """Open new client dialog"""
        dialog = ClientFormDialog(self, db=self.db)
        if dialog.exec():
            self.load_clients()
    
    def search_clients(self):
        """Search clients"""
        query = self.search_input.text().strip()
        if not query:
            self.load_clients()
            return
        
        self.table.setRowCount(0)
        clients = ClientCRUD.search(self.db, query)
        
        for row, client in enumerate(clients):
            self.table.insertRow(row)
            self.table.setItem(row, 0, QTableWidgetItem(str(client.id)))
            self.table.setItem(row, 1, QTableWidgetItem(client.name))
            self.table.setItem(row, 2, QTableWidgetItem(client.email or ""))
            self.table.setItem(row, 3, QTableWidgetItem(client.phone or ""))


def main():
    """Main entry point"""
    app = QApplication([])
    window = ClientListWindow()
    window.show()
    app.exec()


if __name__ == "__main__":
    main()
