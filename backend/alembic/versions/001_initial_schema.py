"""initial_schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-11-23 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. users
    op.create_table(
        'users',
        sa.Column('user_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('full_name', sa.String(length=150), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=50), nullable=False, server_default='CREATOR'),
        sa.Column('account_status', sa.String(length=50), nullable=False, server_default='ACTIVE'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('user_id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_user_id'), 'users', ['user_id'], unique=False)

    # 2. categories
    op.create_table(
        'categories',
        sa.Column('category_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('category_name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('category_id')
    )
    op.create_index(op.f('ix_categories_category_id'), 'categories', ['category_id'], unique=False)
    op.create_index(op.f('ix_categories_category_name'), 'categories', ['category_name'], unique=True)

    # 3. assets
    op.create_table(
        'assets',
        sa.Column('asset_id', sa.String(length=64), nullable=False),
        sa.Column('creator_id', sa.Integer(), nullable=False),
        sa.Column('category_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('original_filename', sa.String(length=255), nullable=False),
        sa.Column('stored_filename', sa.String(length=255), nullable=False),
        sa.Column('file_path', sa.String(length=500), nullable=False),
        sa.Column('file_size', sa.BigInteger(), nullable=False),
        sa.Column('mime_type', sa.String(length=100), nullable=False),
        sa.Column('visibility', sa.String(length=50), nullable=False, server_default='PUBLIC'),
        sa.Column('registration_status', sa.String(length=50), nullable=False, server_default='PENDING'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('registered_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['category_id'], ['categories.category_id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['creator_id'], ['users.user_id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('asset_id'),
        sa.UniqueConstraint('stored_filename')
    )
    op.create_index(op.f('ix_assets_asset_id'), 'assets', ['asset_id'], unique=False)
    op.create_index(op.f('ix_assets_category_id'), 'assets', ['category_id'], unique=False)
    op.create_index(op.f('ix_assets_creator_id'), 'assets', ['creator_id'], unique=False)
    op.create_index(op.f('ix_assets_registration_status'), 'assets', ['registration_status'], unique=False)

    # 4. asset_versions
    op.create_table(
        'asset_versions',
        sa.Column('version_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('asset_id', sa.String(length=64), nullable=False),
        sa.Column('version_number', sa.Integer(), nullable=False),
        sa.Column('file_hash', sa.String(length=64), nullable=False),
        sa.Column('hash_algorithm', sa.String(length=32), nullable=False, server_default='SHA-256'),
        sa.Column('file_path', sa.String(length=500), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['asset_id'], ['assets.asset_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('version_id'),
        sa.UniqueConstraint('asset_id', 'version_number', name='uq_asset_version')
    )
    op.create_index(op.f('ix_asset_versions_asset_id'), 'asset_versions', ['asset_id'], unique=False)
    op.create_index(op.f('ix_asset_versions_file_hash'), 'asset_versions', ['file_hash'], unique=False)
    op.create_index(op.f('ix_asset_versions_version_id'), 'asset_versions', ['version_id'], unique=False)

    # 5. blockchain_records
    op.create_table(
        'blockchain_records',
        sa.Column('record_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('asset_id', sa.String(length=64), nullable=False),
        sa.Column('version_id', sa.Integer(), nullable=False),
        sa.Column('transaction_hash', sa.String(length=66), nullable=False),
        sa.Column('block_number', sa.BigInteger(), nullable=False),
        sa.Column('network_name', sa.String(length=100), nullable=False),
        sa.Column('contract_address', sa.String(length=42), nullable=False),
        sa.Column('blockchain_timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.Column('transaction_status', sa.String(length=50), nullable=False, server_default='CONFIRMED'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['asset_id'], ['assets.asset_id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['version_id'], ['asset_versions.version_id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('record_id'),
        sa.UniqueConstraint('transaction_hash')
    )
    op.create_index(op.f('ix_blockchain_records_asset_id'), 'blockchain_records', ['asset_id'], unique=False)
    op.create_index(op.f('ix_blockchain_records_record_id'), 'blockchain_records', ['record_id'], unique=False)
    op.create_index(op.f('ix_blockchain_records_transaction_hash'), 'blockchain_records', ['transaction_hash'], unique=True)
    op.create_index(op.f('ix_blockchain_records_version_id'), 'blockchain_records', ['version_id'], unique=False)

    # 6. licenses
    op.create_table(
        'licenses',
        sa.Column('license_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('asset_id', sa.String(length=64), nullable=False),
        sa.Column('creator_id', sa.Integer(), nullable=False),
        sa.Column('licensee_id', sa.Integer(), nullable=False),
        sa.Column('license_type', sa.String(length=50), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('start_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('expiry_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='ACTIVE'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint('expiry_date IS NULL OR expiry_date >= start_date', name='chk_license_dates'),
        sa.ForeignKeyConstraint(['asset_id'], ['assets.asset_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['creator_id'], ['users.user_id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['licensee_id'], ['users.user_id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('license_id')
    )
    op.create_index(op.f('ix_licenses_asset_id'), 'licenses', ['asset_id'], unique=False)
    op.create_index(op.f('ix_licenses_license_id'), 'licenses', ['license_id'], unique=False)
    op.create_index(op.f('ix_licenses_licensee_id'), 'licenses', ['licensee_id'], unique=False)

    # 7. verifications
    op.create_table(
        'verifications',
        sa.Column('verification_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('verifier_id', sa.Integer(), nullable=True),
        sa.Column('asset_id', sa.String(length=64), nullable=True),
        sa.Column('submitted_hash', sa.String(length=64), nullable=False),
        sa.Column('verification_result', sa.String(length=50), nullable=False),
        sa.Column('verified_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['asset_id'], ['assets.asset_id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['verifier_id'], ['users.user_id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('verification_id')
    )
    op.create_index(op.f('ix_verifications_asset_id'), 'verifications', ['asset_id'], unique=False)
    op.create_index(op.f('ix_verifications_submitted_hash'), 'verifications', ['submitted_hash'], unique=False)
    op.create_index(op.f('ix_verifications_verification_id'), 'verifications', ['verification_id'], unique=False)
    op.create_index(op.f('ix_verifications_verifier_id'), 'verifications', ['verifier_id'], unique=False)

    # 8. disputes
    op.create_table(
        'disputes',
        sa.Column('dispute_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('asset_id', sa.String(length=64), nullable=False),
        sa.Column('reporter_id', sa.Integer(), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('evidence_path', sa.String(length=500), nullable=True),
        sa.Column('dispute_status', sa.String(length=50), nullable=False, server_default='PENDING'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['asset_id'], ['assets.asset_id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['reporter_id'], ['users.user_id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('dispute_id')
    )
    op.create_index(op.f('ix_disputes_asset_id'), 'disputes', ['asset_id'], unique=False)
    op.create_index(op.f('ix_disputes_dispute_id'), 'disputes', ['dispute_id'], unique=False)
    op.create_index(op.f('ix_disputes_dispute_status'), 'disputes', ['dispute_status'], unique=False)

    # 9. ownership_history
    op.create_table(
        'ownership_history',
        sa.Column('history_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('asset_id', sa.String(length=64), nullable=False),
        sa.Column('previous_owner_id', sa.Integer(), nullable=True),
        sa.Column('new_owner_id', sa.Integer(), nullable=False),
        sa.Column('transaction_reference', sa.String(length=100), nullable=True),
        sa.Column('changed_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['asset_id'], ['assets.asset_id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['new_owner_id'], ['users.user_id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['previous_owner_id'], ['users.user_id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('history_id')
    )
    op.create_index(op.f('ix_ownership_history_asset_id'), 'ownership_history', ['asset_id'], unique=False)
    op.create_index(op.f('ix_ownership_history_history_id'), 'ownership_history', ['history_id'], unique=False)

    # 10. audit_logs
    op.create_table(
        'audit_logs',
        sa.Column('log_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('entity_type', sa.String(length=100), nullable=False),
        sa.Column('entity_id', sa.String(length=100), nullable=False),
        sa.Column('details', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('log_id')
    )
    op.create_index(op.f('ix_audit_logs_log_id'), 'audit_logs', ['log_id'], unique=False)
    op.create_index(op.f('ix_audit_logs_user_id'), 'audit_logs', ['user_id'], unique=False)

def downgrade() -> None:
    op.drop_table('audit_logs')
    op.drop_table('ownership_history')
    op.drop_table('disputes')
    op.drop_table('verifications')
    op.drop_table('licenses')
    op.drop_table('blockchain_records')
    op.drop_table('asset_versions')
    op.drop_table('assets')
    op.drop_table('categories')
    op.drop_table('users')
