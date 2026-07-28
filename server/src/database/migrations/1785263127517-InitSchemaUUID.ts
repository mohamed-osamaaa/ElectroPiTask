import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchemaUUID1785263127517 implements MigrationInterface {
    name = 'InitSchemaUUID1785263127517'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`tasks\` (\`id\` varchar(36) NOT NULL, \`title\` varchar(200) NOT NULL, \`description\` text NULL, \`status\` enum ('todo', 'in_progress', 'done') NOT NULL DEFAULT 'todo', \`priority\` enum ('low', 'medium', 'high') NOT NULL DEFAULT 'medium', \`due_date\` date NULL, \`project_id\` varchar(36) NOT NULL, \`creator_id\` varchar(36) NOT NULL, \`assignee_id\` varchar(36) NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`users\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(100) NOT NULL, \`email\` varchar(150) NOT NULL, \`password\` varchar(255) NOT NULL, \`role\` enum ('admin', 'member') NOT NULL DEFAULT 'member', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`projects\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(150) NOT NULL, \`description\` text NULL, \`owner_id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`project_members\` (\`id\` varchar(36) NOT NULL, \`project_id\` varchar(36) NOT NULL, \`user_id\` varchar(36) NOT NULL, UNIQUE INDEX \`IDX_b3f491d3a3f986106d281d8eb4\` (\`project_id\`, \`user_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`task_history\` (\`id\` varchar(36) NOT NULL, \`task_id\` varchar(36) NOT NULL, \`project_id\` varchar(36) NOT NULL, \`old_status\` enum ('todo', 'in_progress', 'done') NOT NULL, \`new_status\` enum ('todo', 'in_progress', 'done') NOT NULL, \`changed_by_id\` varchar(36) NOT NULL, \`changed_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`tasks\` ADD CONSTRAINT \`FK_9eecdb5b1ed8c7c2a1b392c28d4\` FOREIGN KEY (\`project_id\`) REFERENCES \`projects\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`tasks\` ADD CONSTRAINT \`FK_f4cb489461bc751498a28852356\` FOREIGN KEY (\`creator_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`tasks\` ADD CONSTRAINT \`FK_855d484825b715c545349212c7f\` FOREIGN KEY (\`assignee_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`projects\` ADD CONSTRAINT \`FK_b1bd2fbf5d0ef67319c91acb5cf\` FOREIGN KEY (\`owner_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`project_members\` ADD CONSTRAINT \`FK_b5729113570c20c7e214cf3f58d\` FOREIGN KEY (\`project_id\`) REFERENCES \`projects\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`project_members\` ADD CONSTRAINT \`FK_e89aae80e010c2faa72e6a49ce8\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`task_history\` ADD CONSTRAINT \`FK_e733285140c013322a9ae1be644\` FOREIGN KEY (\`task_id\`) REFERENCES \`tasks\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`task_history\` ADD CONSTRAINT \`FK_ca674a1019db5ff9e92bca5992e\` FOREIGN KEY (\`changed_by_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`task_history\` DROP FOREIGN KEY \`FK_ca674a1019db5ff9e92bca5992e\``);
        await queryRunner.query(`ALTER TABLE \`task_history\` DROP FOREIGN KEY \`FK_e733285140c013322a9ae1be644\``);
        await queryRunner.query(`ALTER TABLE \`project_members\` DROP FOREIGN KEY \`FK_e89aae80e010c2faa72e6a49ce8\``);
        await queryRunner.query(`ALTER TABLE \`project_members\` DROP FOREIGN KEY \`FK_b5729113570c20c7e214cf3f58d\``);
        await queryRunner.query(`ALTER TABLE \`projects\` DROP FOREIGN KEY \`FK_b1bd2fbf5d0ef67319c91acb5cf\``);
        await queryRunner.query(`ALTER TABLE \`tasks\` DROP FOREIGN KEY \`FK_855d484825b715c545349212c7f\``);
        await queryRunner.query(`ALTER TABLE \`tasks\` DROP FOREIGN KEY \`FK_f4cb489461bc751498a28852356\``);
        await queryRunner.query(`ALTER TABLE \`tasks\` DROP FOREIGN KEY \`FK_9eecdb5b1ed8c7c2a1b392c28d4\``);
        await queryRunner.query(`DROP TABLE \`task_history\``);
        await queryRunner.query(`DROP INDEX \`IDX_b3f491d3a3f986106d281d8eb4\` ON \`project_members\``);
        await queryRunner.query(`DROP TABLE \`project_members\``);
        await queryRunner.query(`DROP TABLE \`projects\``);
        await queryRunner.query(`DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``);
        await queryRunner.query(`DROP TABLE \`users\``);
        await queryRunner.query(`DROP TABLE \`tasks\``);
    }

}
